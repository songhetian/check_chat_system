from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.models import User, Role, RolePermission, AuditLog
import hashlib, secrets, json, logging, traceback, jwt, os
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/auth", tags=["Auth"])
security = HTTPBearer()
logger = logging.getLogger("SmartCS")

# V5.00: 物理级无状态鉴权配置
JWT_SECRET = os.getenv("JWT_SECRET", "smart-cs-tactical-link-2024-secure")
JWT_ALGORITHM = "HS256"

def get_hash(p: str, s: str):
    return hashlib.sha256((p + s).encode()).hexdigest()

async def get_current_user(request: Request, creds: HTTPAuthorizationCredentials = Depends(security)):
    token = creds.credentials
    try:
        # 1. 物理校验 JWT 签名
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # 2. V5.20: 引入黑名单拦截 (物理撤回权)
        redis = request.app.state.redis
        if redis:
            is_blocked = await redis.get(f"blacklist:{payload['username']}")
            if is_blocked:
                logger.warning(f"🚫 [物理拦截] 处于 Redis 黑名单的用户尝试访问: {payload['username']}")
                raise HTTPException(status_code=401, detail="您的战术链路已被指挥部物理切断")
        
        # V5.42: 数据库兜底校验 (防止 Redis 重启后同步间隙)
        from tortoise import Tortoise
        conn = Tortoise.get_connection("default")
        sql = "SELECT id FROM blacklist WHERE username = %s AND expired_at > NOW() LIMIT 1"
        res = await conn.execute_query_dict(sql, [payload['username']])
        if res:
            logger.warning(f"🚫 [物理拦截] 处于 DB 黑名单的用户尝试访问: {payload['username']}")
            if redis: await redis.setex(f"blacklist:{payload['username']}", 3600, "1") # 自动同步回缓存
            raise HTTPException(status_code=401, detail="战术封禁中，禁止建立链路")
                
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning(f"🚨 [鉴权失效] 令牌已过期")
        raise HTTPException(status_code=401, detail="令牌已过期")
    except jwt.InvalidTokenError:
        # 为了兼容性，尝试在 Redis 中找旧版 token (过渡期)
        redis = request.app.state.redis
        if redis:
            cached = await redis.get(f"token:{token}")
            if cached: return json.loads(cached)
        
        logger.warning(f"🚨 [鉴权失败] 无效令牌: {token[:10]}...")
        raise HTTPException(status_code=401, detail="身份凭证无效")
    except Exception as e:
        logger.error(f"🚨 [鉴权异常]: {e}")
        raise HTTPException(status_code=500, detail="鉴权引擎解析失败")

def check_permission(required_perm: str):
    async def _check(user: dict = Depends(get_current_user)):
        if required_perm not in user.get("permissions", []):
            raise HTTPException(status_code=403, detail=f"权限熔断：缺失动作权限 [{required_perm}]")
        return user
    return _check

@router.post("/login")
async def login(data: dict, request: Request):
    try:
        u, p = data.get("username"), data.get("password")
        redis = request.app.state.redis
        
        user = await User.get_or_none(username=u, is_deleted=0).select_related("department", "role")
        if not user: return {"status": "error", "message": "身份核验未通过"}
        if get_hash(p, user.salt) != user.password_hash: return {"status": "error", "message": "访问密钥错误"}

        # 1. 精准拉取权限集
        role_id = user.role_id if user.role_id else 0
        perms = []
        if role_id > 0:
            perms_data = await RolePermission.filter(role_id=role_id).values_list("permission_code", flat=True)
            perms = [str(p) for p in perms_data if p]

        role_code = user.role.code if user.role else "GUEST"
        dept_id = user.department_id if user.department_id else 0
        dept_name = user.department.name if user.department else "独立战术单元"

        # 2. 构造 JWT 载荷 (包含所有核心状态)
        user_payload = {
            "id": user.id,
            "username": user.username,
            "real_name": user.real_name or user.username,
            "role_id": role_id,
            "role_code": role_code,
            "dept_id": dept_id,
            "dept_name": dept_name,
            "permissions": perms,
            "exp": datetime.utcnow() + timedelta(days=7) # 延长有效期至 7 天
        }
        
        # 3. 物理签发
        token = jwt.encode(user_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        if redis: 
            # 记录活跃映射（用于统计，但不作为鉴权唯一依据）
            await redis.setex(f"active_token:{user.username}", 3600 * 24 * 7, token)
            await AuditLog.create(operator=user.real_name or user.username, action="LOGIN", target=user.username, details="JWT 链路建立成功")

        return {
            "status": "ok", 
            "data": {
                "user": {
                    "username": user.username, 
                    "real_name": user.real_name or user.username, 
                    "role_id": role_id,
                    "role_code": role_code,
                    "dept_name": dept_name,
                    "tactical_score": user.tactical_score,
                    "permissions": perms
                }, 
                "token": token
            }
        }
    except Exception as e:
        logger.error(f"❌ [登录崩溃] {traceback.format_exc()}")
        return {"status": "error", "message": f"中枢逻辑熔断: {str(e)}"}

        return {
            "status": "ok", 
            "data": {
                "user": {
                    "username": user.username, 
                    "real_name": user.real_name or user.username, 
                    "role_id": role_id,
                    "role_code": role_code,
                    "dept_name": dept_name,
                    "tactical_score": user.tactical_score,
                    "permissions": perms
                }, 
                "token": token
            }
        }
    except Exception as e:
        logger.error(f"❌ [登录崩溃] Traceback: {traceback.format_exc()}")
        return {"status": "error", "message": f"中枢逻辑熔断: {str(e)}"}

@router.post("/logout")
async def logout(request: Request, user_info: dict = Depends(get_current_user)):
    redis = request.app.state.redis
    if redis:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            await redis.delete(f"token:{token}")
            await redis.delete(f"active_token:{user_info['username']}")
            await AuditLog.create(
                operator=user_info.get("real_name", user_info["username"]),
                action="LOGOUT",
                target=user_info["username"],
                details="操作员主动销毁令牌"
            )
    return {"status": "ok"}

@router.get("/me")
async def get_me(user_info: dict = Depends(get_current_user)):
    """[物理同步] 获取当前登录操作员的最新实战态势数据"""
    try:
        user = await User.get_or_none(username=user_info["username"]).select_related("department", "role")
        if not user: raise HTTPException(status_code=404, detail="操作员不存在")
        
        # 安全获取权限集
        perms_data = await RolePermission.filter(role_id=user.role_id).values_list("permission_code", flat=True)
        perms = list(perms_data) if perms_data else []
        
        return {
            "status": "ok",
            "data": {
                "username": user.username,
                "real_name": user.real_name or user.username,
                "role_id": user.role_id,
                "role_code": user.role.code if user.role else "GUEST",
                "dept_name": user.department.name if user.department else "独立战术单元",
                "tactical_score": user.tactical_score,
                "permissions": perms
            }
        }
    except Exception as e:
        logger.error(f"❌ [数据同步失败]: {e}")
        raise HTTPException(status_code=500, detail="指挥中枢数据同步异常")
