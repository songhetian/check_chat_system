from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.models import User, Role, RolePermission, AuditLog
import hashlib, secrets, json, logging

router = APIRouter(prefix="/api/auth", tags=["Auth"])
security = HTTPBearer()
logger = logging.getLogger("SmartCS")

def get_hash(p: str, s: str):
    return hashlib.sha256((p + s).encode()).hexdigest()

async def get_current_user(request: Request, creds: HTTPAuthorizationCredentials = Depends(security)):
    token = creds.credentials
    redis = request.app.state.redis
    if not redis:
        print("🚨 [鉴权故障] Redis 连接未就绪")
        raise HTTPException(status_code=500, detail="中枢缓存脱机")
    
    cached = await redis.get(f"token:{token}")
    if not cached: 
        print(f"🚨 [鉴权失效] 尝试匹配令牌: {token[:10]}... | 匹配结果: 未命中")
        raise HTTPException(status_code=401, detail="令牌失效或已过期")
    
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
        "role_id": user.role_id,
        "role_code": user.role.code,
        "dept_id": user.department_id,
        "permissions": list(perms) # 下发权限集
    }
    
    if redis: 
        # [单设备登录控制] 检查并注销该操作员之前的活动会话
        old_token = await redis.get(f"active_token:{user.username}")
        if old_token:
            await redis.delete(f"token:{old_token}")
            
            # 物理阻断：如果该用户当前有活跃的 WS 链路，强制断开
            ws_manager = getattr(request.app.state, 'ws_manager', None)
            if ws_manager and user.username in ws_manager.active_connections:
                try:
                    old_ws = ws_manager.active_connections[user.username]
                    await old_ws.send_json({"type": "TERMINATE_SESSION", "message": "检测到账号在其他设备登录，当前链路已强制切断"})
                    await old_ws.close(code=1001)
                    logger.warning(f"🚫 [单设备控制] 已物理断开用户 {user.username} 的旧设备 WS 链路")
                except Exception as e:
                    logger.error(f"⚠️ [单设备控制] 断开旧链路失败: {e}")

            # 审计记录：单设备挤压
            await AuditLog.create(
                operator=user.real_name,
                action="SESSION_PREEMPTED",
                target=user.username,
                details="账号在新设备登录，旧会话已强制下线并物理切断 WS 链路"
            )
            logger.warning(f"⚠️ [单设备控制] 操作员 {user.username} 在新设备登录，旧会话已强制下线")
            
        # 存储新令牌及其映射关系
        await redis.setex(f"token:{token}", 3600 * 24, json.dumps(user_payload))
        await redis.setex(f"active_token:{user.username}", 3600 * 24, token)

    return {
        "status": "ok", 
        "data": {
            "user": {
                "username": user.username, 
                "real_name": user.real_name, 
                "role_id": user.role_id,
                "role_code": user.role.code,
                "dept_name": user.department.name if user.department else "独立战术单元",
                "tactical_score": user.tactical_score,
                "permissions": list(perms)
            }, 
            "token": token
        }
    }

@router.post("/logout")
async def logout(request: Request, user_info: dict = Depends(get_current_user)):
    """[安全退出] 销毁当前会话令牌"""
    redis = request.app.state.redis
    if redis:
        # 从 Header 提取当前 token
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            await redis.delete(f"token:{token}")
            await redis.delete(f"active_token:{user_info['username']}")
            
            # 审计记录：主动退出
            await AuditLog.create(
                operator=user_info.get("real_name", user_info["username"]),
                action="LOGOUT",
                target=user_info["username"],
                details="操作员主动销毁战术令牌并退出系统"
            )
            logger.info(f"🚪 [安全退出] 操作员 {user_info['username']} 已主动销毁战术令牌")
    return {"status": "ok", "message": "已从战术中枢安全脱离"}

@router.get("/me")
async def get_me(user_info: dict = Depends(get_current_user)):
    """[物理同步] 获取当前登录操作员的最新实战态势数据"""
    user = await User.get_or_none(username=user_info["username"]).select_related("department", "role")
    if not user: raise HTTPException(status_code=404, detail="操作员不存在")
    
    # 同步最新权限 (防止管理员在后台修改后未立即生效)
    perms = await RolePermission.filter(role_id=user.role_id).values_list("permission_code", flat=True)
    
    return {
        "status": "ok",
        "data": {
            "username": user.username,
            "real_name": user.real_name,
            "role_id": user.role_id,
            "role_code": user.role.code,
            "dept_name": user.department.name if user.department else "独立战术单元",
            "tactical_score": user.tactical_score,
            "permissions": list(perms)
        }
    }