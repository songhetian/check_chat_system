from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.models import User, Role
import hashlib, secrets, json

router = APIRouter(prefix="/api/auth", tags=["Auth"])
security = HTTPBearer()

def get_hash(p: str, s: str):
    return hashlib.sha256((p + s).encode()).hexdigest()

@router.post("/login")
async def login(data: dict, request: Request):
    u, p = data.get("username"), data.get("password")
    redis = request.app.state.redis
    
    # 真实数据库查询，关联角色与部门
    user = await User.get_or_none(username=u, is_deleted=0).select_related("department", "role")
    if not user:
        return {"status": "error", "message": "身份核验未通过"}
    
    # 校验密码
    if get_hash(p, user.salt) != user.password_hash:
        return {"status": "error", "message": "访问密钥错误"}

    # 生成战术令牌
    token = "tk_" + secrets.token_hex(16)
    
    # 将用户信息缓存至 Redis 以供后续接口极速鉴权与隔离
    user_payload = {
        "id": user.id,
        "username": user.username,
        "real_name": user.real_name,
        "role_code": user.role.code,
        "dept_id": user.department_id,
        "dept_name": user.department.name if user.department else "未分配"
    }
    if redis:
        await redis.setex(f"token:{token}", 3600 * 24, json.dumps(user_payload))

    return {
        "status": "ok", 
        "data": {
            "user": {
                "username": user.username, 
                "real_name": user.real_name, 
                "role_code": user.role.code,
                "role_name": user.role.name,
                "department": user_payload["dept_name"]
            }, 
            "token": token
        }
    }

async def get_current_user(request: Request, creds: HTTPAuthorizationCredentials = Depends(security)):
    """
    [战术依赖项] 核心鉴权守卫，负责提取用户信息并注入请求上下文
    """
    token = creds.credentials
    redis = request.app.state.redis
    if not redis:
        # Fallback: 如果 Redis 脱机，尝试从 DB 查询 (非生产推荐)
        raise HTTPException(status_code=503, detail="中枢缓存服务脱机")
    
    cached = await redis.get(f"token:{token}")
    if not cached:
        raise HTTPException(status_code=401, detail="令牌已过期或失效")
    
    return json.loads(cached)