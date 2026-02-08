from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.models import User, Role, RolePermission, AuditLog
import hashlib, secrets, json, logging, traceback

router = APIRouter(prefix="/api/auth", tags=["Auth"])
security = HTTPBearer()
logger = logging.getLogger("SmartCS")

def get_hash(p: str, s: str):
    return hashlib.sha256((p + s).encode()).hexdigest()

async def get_current_user(request: Request, creds: HTTPAuthorizationCredentials = Depends(security)):
    token = creds.credentials
    redis = request.app.state.redis
    if not redis:
        logger.error("🚨 [鉴权故障] Redis 连接未就绪")
        raise HTTPException(status_code=500, detail="中枢缓存脱机")
    
    try:
        cached = await redis.get(f"token:{token}")
        if not cached: 
            logger.warning(f"🚨 [鉴权失效] 令牌未命中: {token[:10]}...")
            raise HTTPException(status_code=401, detail="令牌失效或已过期")
        return json.loads(cached)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"🚨 [鉴权异常]: {e}")
        raise HTTPException(status_code=500, detail="鉴权中枢解析失败")

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

        # 核心修复：采用极其严谨的权限拉取逻辑
        role_id = user.role_id if user.role_id else 0
        perms = []
        try:
            if role_id > 0:
                perms_data = await RolePermission.filter(role_id=role_id).values_list("permission_code", flat=True)
                if perms_data is not None:
                    # 强制转换为列表，并过滤掉任何潜在的 None 值
                    perms = [str(p) for p in perms_data if p is not None]
        except Exception as perm_err:
            logger.error(f"⚠️ [权限拉取轻微异常]: {perm_err}")
            perms = [] # 降级处理，不中断登录

        role_code = user.role.code if (user.role and hasattr(user.role, 'code')) else "GUEST"
        dept_id = user.department_id if user.department_id else 0
        # 再次确保 dept_name 绝对安全
        dept_name = "独立战术单元"
        if user.department and hasattr(user.department, 'name'):
            dept_name = user.department.name

        token = "tk_" + secrets.token_hex(16)
        user_payload = {
            "id": user.id,
            "username": user.username,
            "real_name": user.real_name or user.username,
            "role_id": role_id,
            "role_code": role_code,
            "dept_id": dept_id,
            "permissions": perms
        }
        
        if redis: 
            # 记录活跃令牌映射
            old_token = await redis.get(f"active_token:{user.username}")
            
            # V4.90: 物理策略修正 - 针对 admin 允许战术多开，不挤下线旧连接
            if old_token and user.username != 'admin':
                await redis.delete(f"token:{old_token}")
                # 物理下线逻辑
                ws_manager = getattr(request.app.state, 'ws_manager', None)
                if ws_manager and user.username in ws_manager.active_connections:
                    try:
                        old_ws = ws_manager.active_connections[user.username]
                        await old_ws.send_json({"type": "TERMINATE_SESSION", "message": "账号在新设备登录"})
                        await old_ws.close(code=1001)
                    except: pass

            await redis.setex(f"token:{token}", 3600 * 24, json.dumps(user_payload))
            await redis.setex(f"active_token:{user.username}", 3600 * 24, token)

            # 记录审计 (放在 Redis 之后确保主流程成功)
            await AuditLog.create(
                operator=user.real_name or user.username,
                action="LOGIN",
                target=user.username,
                details="建立战术链路成功"
            )

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
