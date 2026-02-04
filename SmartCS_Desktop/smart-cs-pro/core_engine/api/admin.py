from fastapi import APIRouter, Query, Request, Depends, HTTPException
from core.models import User, Department, ViolationRecord, Role, Permission, RolePermission, PolicyCategory, SensitiveWord, KnowledgeBase, Notification, AuditLog, Product, Customer, Platform

# ... (在文件末尾追加)

@router.get("/products")
async def get_products(page: int = 1, size: int = 12, current_user: dict = Depends(get_current_user)):
    query = Product.filter(is_deleted=0)
    total = await query.count()
    data = await query.offset((page - 1) * size).limit(size).order_by("-id").values()
    return {"status": "ok", "data": data, "total": total}

@router.get("/customers")
async def get_customers(page: int = 1, size: int = 12, search: str = "", current_user: dict = Depends(get_current_user)):
    query = Customer.filter(is_deleted=0)
    if search: query = query.filter(Q(name__icontains=search) | Q(tags__icontains=search))
    total = await query.count()
    data = await query.offset((page - 1) * size).limit(size).order_by("-id").values()
    return {"status": "ok", "data": data, "total": total}

@router.get("/platforms")
async def get_platforms(page: int = 1, size: int = 12, current_user: dict = Depends(get_current_user)):
    query = Platform.filter(is_deleted=0)
    total = await query.count()
    data = await query.offset((page - 1) * size).limit(size).order_by("-id").values()
    return {"status": "ok", "data": data, "total": total}

# ... (末尾追加接口)

@router.get("/audit-logs")
async def get_audit_logs(page: int = 1, size: int = 15, current_user: dict = Depends(get_current_user)):
    query = AuditLog.filter(is_deleted=0)
    total = await query.count()
    data = await query.order_by("-id").offset((page - 1) * size).limit(size).values()
    return {"status": "ok", "data": data, "total": total}
from api.auth import get_current_user, check_permission
from tortoise.expressions import Q
from tortoise.functions import Count
from tortoise.transactions import in_transaction
import os, json, asyncio

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/agents")
async def get_agents(
    request: Request, 
    current_user: dict = Depends(get_current_user),
    page: int = 1, 
    size: int = 50,
    search: str = "",
    role_only: str = Query(None) # 修改为从 Query 显式拉取，避免默认值冲突
):
    redis = request.app.state.redis
    offset = (page - 1) * size
    online_usernames = await redis.smembers("online_agents_set") if redis else []

    # 1. 基础过滤：必须未删除，且符合角色要求
    query = User.filter(is_deleted=0).select_related("role")
    
    # 强制执行角色代码过滤
    if role_only:
        query = query.filter(role__code=role_only)
    
    # 2. 物理数据隔离：主管只能看本部门
    if current_user["role_code"] == "ADMIN":
        query = query.filter(department_id=current_user["dept_id"])
    
    if search: 
        query = query.filter(Q(username__icontains=search) | Q(real_name__icontains=search))

    total = await query.count()
    agents_data = await query.order_by("-id").limit(size).offset(offset).values(
        "id", "username", "real_name", "role_id", "role__name", "role__code", "tactical_score", "department_id"
    )
    
    result = []
    
    # 异步并发执行每一行的统计逻辑，大幅提升响应速度
    async def process_agent(a):
        # 1. 获取部门名称
        dept = await Department.get_or_none(id=a["department_id"]) if a["department_id"] else None
        # 2. 获取最近违规
        last_v = await ViolationRecord.filter(user_id=a["id"], is_deleted=0).order_by("-timestamp").first()
        # 3. 统计荣誉与培训
        from core.models import UserReward, TrainingSession
        r_count = await UserReward.filter(user_id=a["id"]).count()
        t_session = await TrainingSession.filter(user_id=a["id"]).order_by("-updated_at").first()
        # 4. 统计管理部门数
        m_count = await Department.filter(manager_id=a["id"], is_deleted=0).count()
        
        return {
            "username": a["username"], 
            "real_name": a["real_name"],
            "role_id": a["role_id"], 
            "role_name": a["role__name"], 
            "role_code": a["role__code"],
            "dept_name": dept.name if dept else "全域节点",
            "is_manager": m_count > 0, 
            "is_online": a["username"] in online_usernames,
            "tactical_score": a["tactical_score"],
            "reward_count": r_count,
            "training_progress": t_session.progress if t_session else 0,
            "last_violation_type": last_v.keyword if last_v else None,
            "last_risk_score": last_v.risk_score if last_v else 0
        }

    # 使用 asyncio.gather 并发处理
    result = await asyncio.gather(*[process_agent(a) for a in agents_data])
    
    return {"status": "ok", "data": list(result), "total": total}

# 保持其他通知、部门、RBAC 接口逻辑 ...
@router.post("/notifications/read")
async def mark_notification_read(data: dict, current_user: dict = Depends(get_current_user)):
    notif_id = data.get("id")
    async with in_transaction() as conn:
        if notif_id == "ALL": await Notification.filter(is_deleted=0).update(is_read=1)
        else:
            notif = await Notification.get_or_none(id=notif_id); 
            if notif: notif.is_read = 1; await notif.save(using_db=conn)
    return {"status": "ok"}

@router.get("/notifications")
async def get_notifications(page: int = 1, size: int = 10, current_user: dict = Depends(get_current_user)):
    offset = (page - 1) * size
    query = Notification.filter(is_deleted=0)
    total = await query.count()
    data = await query.order_by("-created_at").limit(size).offset(offset).values()
    return {"status": "ok", "data": data, "total": total}

@router.post("/command")
async def send_command(data: dict, request: Request, current_user: dict = Depends(get_current_user)):
    """
    [实战闭环] 指挥官指令物理下发接口
    """
    target_username = data.get("username")
    cmd_type = data.get("type") # LOCK, PUSH, VOICE, SOP
    cmd_payload = data.get("payload", {})
    
    ws_manager = request.app.state.ws_manager
    if not ws_manager:
        return {"status": "error", "message": "指令中枢未挂载"}
    
    # 物理下发：通过 WebSocket 精准靶向坐席终端
    await ws_manager.send_personal_message({
        "type": f"TACTICAL_{cmd_type}",
        "payload": cmd_payload,
        "commander": current_user["real_name"]
    }, target_username)
    
    # 同时写入审计流 (略，后续补全)
    return {"status": "ok"}

@router.get("/departments")
async def get_departments(request: Request, current_user: dict = Depends(get_current_user), page: int = 1, size: int = 10):
    offset = (page - 1) * size
    query = Department.filter(is_deleted=0).select_related("manager")
    if current_user["role_code"] == "ADMIN": query = query.filter(id=current_user["dept_id"])
    total = await query.count()
    depts_data = await query.limit(size).offset(offset).annotate(member_count=Count("users")).values(
        "id", "name", "member_count", "manager__username", "manager__real_name"
    )
    return {"status": "ok", "data": depts_data, "total": total}

@router.get("/roles")
async def get_roles(current_user: dict = Depends(get_current_user)):
    return {"status": "ok", "data": await Role.filter(is_deleted=0).values("id", "name", "code")}

@router.get("/permissions")
async def get_permissions(current_user: dict = Depends(get_current_user)):
    return {"status": "ok", "data": await Permission.filter(is_deleted=0).values("id", "code", "name", "module")}

@router.get("/role/permissions")
async def get_role_permissions(role_id: int, current_user: dict = Depends(get_current_user)):
    perms = await RolePermission.filter(role_id=role_id).values_list("permission_code", flat=True)
    return {"status": "ok", "data": list(perms)}

@router.post("/role/permissions")
async def update_role_permissions(data: dict, request: Request, user: dict = Depends(check_permission("admin:rbac:config"))):
    role_id, new_perms = data.get("role_id"), data.get("permissions", [])
    redis = request.app.state.redis
    async with in_transaction() as conn:
        await RolePermission.filter(role_id=role_id).delete(using_db=conn)
        if new_perms:
            objs = [RolePermission(role_id=role_id, permission_code=p) for p in new_perms]
            await RolePermission.bulk_create(objs, using_db=conn)
    if redis:
        role = await Role.get_or_none(id=role_id)
        role_code = role.code if role else "UNKNOWN"
        await redis.set(f"cache:role_perms:{role_code}", json.dumps(new_perms))
    return {"status": "ok"}