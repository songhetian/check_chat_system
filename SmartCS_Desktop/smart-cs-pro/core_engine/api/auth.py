from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.models import User, Role, RolePermission
import hashlib, secrets, json

router = APIRouter(prefix="/api/auth", tags=["Auth"])
security = HTTPBearer()

def get_hash(p: str, s: str):
    return hashlib.sha256((p + s).encode()).hexdigest()

@router.post("/login")
async def login(data: dict, request: Request):
    u, p = data.get("username"), data.get("password")
    redis = request.app.state.redis
    
    user = await User.get_or_none(username=u, is_deleted=0).select_related("department", "role")
    if not user: return {"status": "error", "message": "身份核验未通过"}
    if get_hash(p, user.salt) != user.password_hash: return {"status": "error", "message": "访问密钥错误"}

    # 核心：拉取该角色的所有具体权限代码
    perms = await RolePermission.filter(role_id=user.role_id).values_list("permission_code", flat=True)

    token = "tk_" + secrets.token_hex(16)
    user_payload = {
        "id": user.id,
        "username": user.username,
        "real_name": user.real_name,
        "role_code": user.role.code,
        "dept_id": user.department_id,
        "permissions": list(perms) # 下发权限集
    }
    if redis: await redis.setex(f"token:{token}", 3600 * 24, json.dumps(user_payload))

    return {
        "status": "ok", 
        "data": {
            "user": {
                "username": user.username, 
                "real_name": user.real_name, 
                "role_code": user.role.code,
                "permissions": list(perms)
            }, 
            "token": token
        }
    }

async def get_current_user(request: Request, creds: HTTPAuthorizationCredentials = Depends(security)):
    token = creds.credentials
    redis = request.app.state.redis
    cached = await redis.get(f"token:{token}") if redis else None
    if not cached: raise HTTPException(status_code=401, detail="令牌失效")
    return json.loads(cached)

def check_permission(required_perm: str):
    """
    [战术校验器] 细粒度权限守卫，用于接口函数 Depend 注入
    """
    async def _check(user: dict = Depends(get_current_user)):
        if required_perm not in user.get("permissions", []):
            raise HTTPException(status_code=403, detail=f"权限熔断：缺失动作权限 [{required_perm}]")
        return user
    return _check
