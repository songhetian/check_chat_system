from fastapi import APIRouter, Query, Request, Depends, HTTPException
from core.models import User, Department, ViolationRecord, Role, Permission, RolePermission, PolicyCategory, SensitiveWord, KnowledgeBase, Notification, AuditLog, Product, Customer, Platform
from api.auth import get_current_user, check_permission
from core.constants import RoleID
from tortoise.expressions import Q
from tortoise.functions import Count
from tortoise.transactions import in_transaction
import os, json, asyncio, time
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# --- 战术审计助手 ---
async def record_audit(operator: str, action: str, target: str, details: str):
    """[物理审计] 记录操作足迹至 MySQL"""
    await AuditLog.create(operator=operator, action=action, target=target, details=details)

@router.get("/agents")
async def get_agents(
    request: Request, 
    current_user: dict = Depends(get_current_user),
    page: int = 1, size: int = 50, search: str = "", role_only: str = Query(None),
    dept_id: str = Query(None) # 补全部门参数
):
    redis = request.app.state.redis
    offset = (page - 1) * size
    online_usernames = await redis.smembers("online_agents_set") if redis else []
    query = User.filter(is_deleted=0).select_related("role")
    
    if role_only: query = query.filter(role__code=role_only)
    
    role_id = current_user.get("role_id")
    role_code = current_user.get("role_code")

    # 核心：物理数据隔离与 HQ 穿透筛选
    actual_dept_id = dept_id if dept_id and dept_id != "" and dept_id != "undefined" else None
    if role_id == RoleID.ADMIN or role_code == "ADMIN":
        query = query.filter(department_id=current_user["dept_id"])
    elif actual_dept_id: # HQ 角色选了部门
        query = query.filter(department_id=actual_dept_id)

    # 核心：拼音检索增强
    if search:
        from pypinyin import lazy_pinyin
        # 1. 尝试直接搜索姓名或账号
        # 2. 如果没有结果或为了更广匹配，可以结合数据库全文检索，或者这里采用 Python 端过滤（针对小数据量）
        # 工业级方案：SQL 原生不支持拼音，需在 User 表增加 pinyin 字段。
        # 战术方案：目前先执行 Q 模糊检索
        query = query.filter(Q(username__icontains=search) | Q(real_name__icontains=search))

    total = await query.count()
    agents_data = await query.order_by("-id").limit(size).offset(offset).values("id", "username", "real_name", "role_id", "role__name", "role__code", "tactical_score", "department_id")
    
    from utils.redis_utils import redis_mgr
    async def process_agent(a):
        dept = await Department.get_or_none(id=a["department_id"]) if a["department_id"] else None
        last_v = await ViolationRecord.filter(user_id=a["id"], is_deleted=0).order_by("-timestamp").first()
        from core.models import UserReward, TrainingSession
        r_count = await UserReward.filter(user_id=a["id"]).count()
        t_session = await TrainingSession.filter(user_id=a["id"]).order_by("-updated_at").first()
        m_count = await Department.filter(manager_id=a["id"], is_deleted=0).count()
        
        # 实时拉取活跃度与锁定状态
        last_activity = await redis_mgr.get_last_activity(a["username"])
        is_locked = await redis_mgr.client.get(f"agent_lock_status:{a['username']}") == "1"
        
        return {
            "id": a["id"], # 显式包含 ID 用于管理
            "username": a["username"], "real_name": a["real_name"],
            "role_id": a["role_id"], "role_name": a["role__name"], "role_code": a["role__code"],
            "dept_name": dept.name if dept else "全域节点",
            "department_id": a["department_id"], # 核心修复：确保回传 ID 用于前端回填
            "is_manager": m_count > 0, "is_online": a["username"] in online_usernames,
            "is_locked": is_locked,
            "tactical_score": a["tactical_score"], "reward_count": r_count,
            "training_progress": t_session.progress if t_session else 0,
            "last_violation_type": last_v.keyword if last_v else None,
            "last_activity": last_activity # 返回活跃时间戳
        }
    result = await asyncio.gather(*[process_agent(a) for a in agents_data])
    return {"status": "ok", "data": result, "total": total}

@router.get("/departments/users")
async def get_dept_users(dept_id: int = Query(...), search: str = Query(""), current_user: dict = Depends(get_current_user)):
    """[物理检索] 获取指定部门的所有成员，用于指派主管"""
    query = User.filter(department_id=dept_id, is_deleted=0)
    if search:
        query = query.filter(Q(real_name__icontains=search) | Q(username__icontains=search))
    
    data = await query.values("id", "username", "real_name")
    return {"status": "ok", "data": data}

@router.post("/agents/update-info")
async def update_agent_info(data: dict, user: dict = Depends(check_permission("admin:user:update"))):
    """[物理重校] 修改操作员基础信息并审计"""
    username = data.get("username")
    real_name = data.get("real_name")
    dept_id = data.get("department_id")
    
    # 核心修正：防止前端传 '' 导致数据库 Int 转换崩溃
    final_dept_id = dept_id if dept_id and dept_id != "" else None
    
    async with in_transaction() as conn:
        await User.filter(username=username).using_db(conn).update(
            real_name=real_name, 
            department_id=final_dept_id
        )
        await record_audit(
            user["real_name"], 
            "USER_UPDATE", 
            username, 
            f"重校基础信息: 姓名->{real_name}, 部门ID->{final_dept_id}"
        )
    return {"status": "ok"}

@router.post("/agents/delete")
async def delete_agent(data: dict, user: dict = Depends(check_permission("admin:user:delete"))):
    username = data.get("username")
    async with in_transaction() as conn:
        await User.filter(username=username).using_db(conn).update(is_deleted=1)
        await record_audit(user["real_name"], "USER_DELETE", username, "物理注销操作员节点")
    return {"status": "ok"}

@router.post("/command")
async def send_command(data: dict, request: Request, user: dict = Depends(check_permission("command:input:lock"))):
    target_username, cmd_type, cmd_payload = data.get("username"), data.get("type"), data.get("payload", {})
    ws_manager = request.app.state.ws_manager
    redis = request.app.state.redis
    if not ws_manager: return {"status": "error", "message": "指令中枢未挂载"}

    # V3.85: 状态持久化 - 如果是锁定指令，同步写入 Redis
    if cmd_type == 'LOCK' and redis:
        lock_val = "1" if cmd_payload.get("lock") else "0"
        await redis.set(f"agent_lock_status:{target_username}", lock_val)
    
    # V3.88: 指令历史持久化 - 如果是 SOP 指令，存入 Redis 列表
    if cmd_type == 'SOP' and redis:
        sop_record = {
            **cmd_payload,
            "timestamp": int(time.time() * 1000),
            "commander": user["real_name"]
        }
        key = f"sop_history:{target_username}"
        await redis.lpush(key, json.dumps(sop_record))
        await redis.ltrim(key, 0, 19) # 仅保留最近 20 条
        await redis.expire(key, 86400 * 3) # 保留 3 天

    await ws_manager.send_personal_message({"type": f"TACTICAL_{cmd_type}", "payload": cmd_payload, "commander": user["real_name"]}, target_username)
    await record_audit(user["real_name"], f"CMD_{cmd_type}", target_username, f"下发物理干预指令: {json.dumps(cmd_payload)}")
    return {"status": "ok"}

@router.post("/force-kill")
async def force_kill_link(data: dict, request: Request, user: dict = Depends(check_permission("command:force:kill"))):
    """[物理打击] 强制切断目标节点的战术链路并根据时长拉黑"""
    target_username = data.get("username")
    duration = int(data.get("duration", 0)) # 单位：秒，0 表示仅踢下线
    redis = request.app.state.redis
    ws_manager = request.app.state.ws_manager
    
    if not target_username: return {"status": "error", "message": "未指定打击目标"}

    # 1. 如果需要封禁，执行物理拉黑
    if duration > 0:
        expiry_dt = datetime.now() + timedelta(seconds=duration)
        # A. 写入 Redis (极速拦截)
        if redis:
            await redis.setex(f"blacklist:{target_username}", duration, "1")
        
        # B. 写入 MySQL (持久化)
        # 注意：此处需先在 core.models 定义 Blacklist 模型或使用原生 SQL
        from tortoise import Tortoise
        conn = Tortoise.get_connection("default")
        sql = "INSERT INTO blacklist (username, expired_at, reason) VALUES (%s, %s, %s)"
        await conn.execute_query(sql, [target_username, expiry_dt.strftime('%Y-%m-%d %H:%M:%S'), f"指挥部手动干预 - 时长: {duration}s"])

    # 2. 物理标记离线
    if redis:
        await redis.srem("online_agents_set", target_username)
        await redis.delete(f"agent_heartbeat:{target_username}")

    # 3. 发送物理下线指令
    if ws_manager:
        await ws_manager.send_personal_message({
            "type": "TERMINATE_SESSION", 
            "message": "指挥部已强制切断您的物理链路" if duration == 0 else f"您的账号已被封禁至 { (datetime.now() + timedelta(seconds=duration)).strftime('%m-%d %H:%M') }",
            "commander": user["real_name"]
        }, target_username)

    await record_audit(user["real_name"], "FORCE_KILL", target_username, f"物理切断链路 (封禁时长: {duration}s)")
    return {"status": "ok", "message": f"目标 {target_username} 已物理切断"}

@router.get("/sop-history")
async def get_sop_history(request: Request, current_user: dict = Depends(get_current_user)):
    """[物理回溯] 从 Redis 获取当前节点的指令历史"""
    redis = request.app.state.redis
    if not redis: return {"status": "ok", "data": []}
    
    key = f"sop_history:{current_user['username']}"
    raw_list = await redis.lrange(key, 0, 19)
    history = [json.loads(x) for x in raw_list]
    return {"status": "ok", "data": history}

@router.get("/departments")
async def get_departments(request: Request, page: int = 1, size: int = 10, current_user: dict = Depends(get_current_user)):
    redis = request.app.state.redis
    role_id = current_user.get("role_id")
    role_code = current_user.get("role_code")

    # 针对 HQ 角色获取全量列表（size=100）进行战术缓存
    is_hq_full_fetch = (role_id == RoleID.HQ or role_code == "HQ") and size >= 100
    cache_key = "cache:static:depts_full"
    
    if is_hq_full_fetch and redis:
        cached = await redis.get(cache_key)
        if cached: return {"status": "ok", "data": json.loads(cached), "total": len(json.loads(cached)), "source": "tactical_cache"}

    offset = (page - 1) * size
    query = Department.filter(is_deleted=0).select_related("manager")
    if role_id == RoleID.ADMIN or role_code == "ADMIN": query = query.filter(id=current_user["dept_id"])
    total = await query.count()
    depts_data = await query.limit(size).offset(offset).annotate(member_count=Count("users")).values("id", "name", "member_count", "manager__username", "manager__real_name")
    
    if is_hq_full_fetch and redis:
        await redis.setex(cache_key, 1800, json.dumps(depts_data)) # 缓存 30 分钟
        
    return {"status": "ok", "data": depts_data, "total": total}

@router.post("/departments")
async def save_department(data: dict, request: Request, user: dict = Depends(check_permission("admin:dept:create"))):
    name = data.get("name")
    redis = request.app.state.redis
    async with in_transaction() as conn:
        await Department.create(name=name, using_db=conn)
        await record_audit(user["real_name"], "DEPT_CREATE", name, "录入新战术单元")
    if redis: await redis.delete("cache:static:depts_full")
    return {"status": "ok"}

@router.post("/departments/update")
async def update_department(data: dict, request: Request, user: dict = Depends(check_permission("admin:dept:update"))):
    dept_id, name, manager_id = data.get("id"), data.get("name"), data.get("manager_id")
    redis = request.app.state.redis
    async with in_transaction() as conn:
        await Department.filter(id=dept_id).using_db(conn).update(name=name, manager_id=manager_id)
        await record_audit(user["real_name"], "DEPT_UPDATE", name, f"调整组织架构, 主管ID: {manager_id}")
    if redis: await redis.delete("cache:static:depts_full")
    return {"status": "ok"}

@router.post("/departments/delete")
async def delete_department(data: dict, request: Request, user: dict = Depends(check_permission("admin:dept:delete"))):
    dept_id = data.get("id")
    redis = request.app.state.redis
    async with in_transaction() as conn:
        dept = await Department.get(id=dept_id)
        await Department.filter(id=dept_id).using_db(conn).update(is_deleted=1)
        await record_audit(user["real_name"], "DEPT_DELETE", dept.name, "物理注销战术单元")
    if redis: await redis.delete("cache:static:depts_full")
    return {"status": "ok"}

@router.get("/products")
async def get_products(page: int = 1, size: int = 12, current_user: dict = Depends(get_current_user)):
    query = Product.filter(is_deleted=0)
    total = await query.count()
    data = await query.offset((page - 1) * size).limit(size).order_by("-id").values()
    return {"status": "ok", "data": data, "total": total}

@router.post("/products")
async def save_product(data: dict, user: dict = Depends(check_permission("admin:asset:create"))):
    async with in_transaction() as conn:
        p = await Product.create(**data, using_db=conn)
        await record_audit(user["real_name"], "PROD_CREATE", p.name, "同步新商品资产")
    return {"status": "ok"}

@router.post("/products/delete")
async def delete_product(data: dict, user: dict = Depends(check_permission("admin:asset:delete"))):
    p_id = data.get("id")
    async with in_transaction() as conn:
        p = await Product.get(id=p_id)
        await Product.filter(id=p_id).using_db(conn).update(is_deleted=1)
        await record_audit(user["real_name"], "PROD_DELETE", p.name, "物理注销商品资产")
    return {"status": "ok"}

@router.post("/platforms/delete")
async def delete_platform(data: dict, user: dict = Depends(check_permission("admin:platform:delete"))):
    p_id = data.get("id")
    async with in_transaction() as conn:
        p = await Platform.get(id=p_id)
        await Platform.filter(id=p_id).using_db(conn).update(is_deleted=1)
        await record_audit(user["real_name"], "PLATFORM_DELETE", p.name, "注销监控目标软件")
    return {"status": "ok"}

@router.get("/platforms")
async def get_platforms(page: int = 1, size: int = 12, current_user: dict = Depends(get_current_user)):
    query = Platform.filter(is_deleted=0)
    total = await query.count()
    data = await query.offset((page - 1) * size).limit(size).order_by("-id").values()
    return {"status": "ok", "data": data, "total": total}

@router.get("/audit-logs")
async def get_audit_logs(page: int = 1, size: int = 15, current_user: dict = Depends(get_current_user)):
    query = AuditLog.filter(is_deleted=0)
    total = await query.count()
    data = await query.order_by("-id").offset((page - 1) * size).limit(size).values()
    return {"status": "ok", "data": data, "total": total}

@router.get("/roles")
async def get_roles(request: Request, current_user: dict = Depends(get_current_user)):
    redis = request.app.state.redis
    cache_key = "cache:static:roles"
    if redis:
        cached = await redis.get(cache_key)
        if cached: return {"status": "ok", "data": json.loads(cached), "source": "tactical_cache"}
    
    data = await Role.filter(is_deleted=0).values("id", "name", "code")
    if redis: await redis.setex(cache_key, 3600, json.dumps(data))
    return {"status": "ok", "data": data}

@router.get("/permissions")
async def get_permissions(request: Request, current_user: dict = Depends(get_current_user)):
    """[物理拉取] 获取全量原子级权限定义清单"""
    redis = request.app.state.redis
    cache_key = "cache:static:permissions"
    if redis:
        cached = await redis.get(cache_key)
        if cached: return {"status": "ok", "data": json.loads(cached), "source": "tactical_cache"}

    data = await Permission.filter(is_deleted=0).values("id", "code", "name", "module")
    if redis: await redis.setex(cache_key, 3600, json.dumps(data))
    return {"status": "ok", "data": data}

@router.get("/role/permissions")
async def get_role_permissions(role_id: int, current_user: dict = Depends(get_current_user)):
    perms = await RolePermission.filter(role_id=role_id, is_deleted=0).values_list("permission_code", flat=True)
    return {"status": "ok", "data": list(perms)}

@router.post("/role/permissions")
async def update_role_permissions(data: dict, request: Request, user: dict = Depends(check_permission("admin:user:update"))):
    role_id, new_perms = data.get("role_id"), data.get("permissions", [])
    redis = request.app.state.redis
    async with in_transaction() as conn:
        await RolePermission.filter(role_id=role_id).update(is_deleted=1)
        if new_perms:
            objs = [RolePermission(role_id=role_id, permission_code=p) for p in new_perms]
            await RolePermission.bulk_create(objs, using_db=conn)
        await record_audit(user["real_name"], "RBAC_SYNC", f"RoleID:{role_id}", f"全量重构权责矩阵: {len(new_perms)}项")
    if redis:
        role = await Role.get_or_none(id=role_id)
        await redis.set(f"cache:role_perms:{role.code if role else 'UNKNOWN'}", json.dumps(new_perms))
        # 关键：清除全量权限缓存
        await redis.delete("cache:static:permissions")
    return {"status": "ok"}

@router.get("/notifications")
async def get_notifications(page: int = 1, size: int = 10, search: str = "", current_user: dict = Depends(get_current_user)):
    offset = (page - 1) * size
    query = Notification.filter(is_deleted=0)
    if search:
        query = query.filter(Q(title__icontains=search) | Q(content__icontains=search))
    total = await query.count()
    data = await query.order_by("-created_at").limit(size).offset(offset).values()
    return {"status": "ok", "data": data, "total": total}

@router.post("/notifications/read")
async def mark_notification_read(data: dict, user: dict = Depends(get_current_user)):
    notif_id = data.get("id")
    if notif_id == "ALL": await Notification.filter(is_read=0).update(is_read=1)
    else: await Notification.filter(id=notif_id).update(is_read=1)
    return {"status": "ok"}