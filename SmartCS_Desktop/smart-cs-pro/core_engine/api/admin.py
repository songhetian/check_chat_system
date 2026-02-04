from fastapi import APIRouter, Query, Request, Depends, HTTPException
from core.models import User, Department, ViolationRecord, Role, Permission, RolePermission, PolicyCategory, SensitiveWord, KnowledgeBase, Notification, AuditLog, Product, Customer, Platform
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
    role_only: str = Query(None)
):
    redis = request.app.state.redis
    offset = (page - 1) * size
    online_usernames = await redis.smembers("online_agents_set") if redis else []

    query = User.filter(is_deleted=0).select_related("role")
    if role_only: query = query.filter(role__code=role_only)
    if current_user["role_code"] == "ADMIN": query = query.filter(department_id=current_user["dept_id"])
    if search: query = query.filter(Q(username__icontains=search) | Q(real_name__icontains=search))

    total = await query.count()
    agents_data = await query.order_by("-id").limit(size).offset(offset).values(
        "id", "username", "real_name", "role_id", "role__name", "role__code", "tactical_score", "department_id"
    )
    
    result = []
    async def process_agent(a):
        dept = await Department.get_or_none(id=a["department_id"]) if a["department_id"] else None
        last_v = await ViolationRecord.filter(user_id=a["id"], is_deleted=0).order_by("-timestamp").first()
        from core.models import UserReward, TrainingSession
        r_count = await UserReward.filter(user_id=a["id"]).count()
        t_session = await TrainingSession.filter(user_id=a["id"]).order_by("-updated_at").first()
        m_count = await Department.filter(manager_id=a["id"], is_deleted=0).count()
        
        return {
            "username": a["username"], "real_name": a["real_name"],
            "role_id": a["role_id"], "role_name": a["role__name"], "role_code": a["role__code"],
            "dept_name": dept.name if dept else "全域节点",
            "is_manager": m_count > 0, "is_online": a["username"] in online_usernames,
            "tactical_score": a["tactical_score"], "reward_count": r_count,
            "training_progress": t_session.progress if t_session else 0,
            "last_violation_type": last_v.keyword if last_v else None
        }
    
    result = await asyncio.gather(*[process_agent(a) for a in agents_data])
    return {"status": "ok", "data": result, "total": total}

@router.post("/command")
async def send_command(data: dict, request: Request, user: dict = Depends(check_permission("command:input:lock"))):
    """
    [实战闭环] 指挥官指令物理下发：注入动作权限熔断
    """
    # ... 原有逻辑
    target_username, cmd_type, cmd_payload = data.get("username"), data.get("type"), data.get("payload", {})
    ws_manager = request.app.state.ws_manager
    if not ws_manager: return {"status": "error", "message": "指令中枢未挂载"}
    await ws_manager.send_personal_message({"type": f"TACTICAL_{cmd_type}", "payload": cmd_payload, "commander": user["real_name"]}, target_username)
    return {"status": "ok"}

@router.get("/departments")
async def get_departments(page: int = 1, size: int = 10, current_user: dict = Depends(get_current_user)):
    # 列表查看仅需登录，但在 Layout 层面已通过 perm 过滤了入口

    offset = (page - 1) * size
    query = Department.filter(is_deleted=0).select_related("manager")
    if current_user["role_code"] == "ADMIN": query = query.filter(id=current_user["dept_id"])
    total = await query.count()
    depts_data = await query.limit(size).offset(offset).annotate(member_count=Count("users")).values(
        "id", "name", "member_count", "manager__username", "manager__real_name"
    )
    return {"status": "ok", "data": depts_data, "total": total}

@router.get("/departments/users")
async def get_dept_users(dept_id: int, search: str = "", current_user: dict = Depends(get_current_user)):
    query = User.filter(department_id=dept_id, is_deleted=0)
    if search: query = query.filter(real_name__icontains=search)
    return {"status": "ok", "data": await query.values("id", "username", "real_name")}

@router.get("/roles")
async def get_roles(current_user: dict = Depends(get_current_user)):
    return {"status": "ok", "data": await Role.filter(is_deleted=0).values("id", "name", "code")}

@router.get("/permissions")
async def get_permissions(current_user: dict = Depends(get_current_user)):
    return {"status": "ok", "data": await Permission.filter(is_deleted=0).values("id", "code", "name", "module")}

@router.get("/role/permissions")
async def get_role_permissions(role_id: int, current_user: dict = Depends(get_current_user)):
    perms = await RolePermission.filter(role_id=role_id, is_deleted=0).values_list("permission_code", flat=True)
    return {"status": "ok", "data": list(perms)}

@router.post("/role/permissions")
async def update_role_permissions(data: dict, request: Request, user: dict = Depends(check_permission("admin:rbac:config"))):
    role_id, new_perms = data.get("role_id"), data.get("permissions", [])
    redis = request.app.state.redis
    async with in_transaction() as conn:
        await RolePermission.filter(role_id=role_id).update(is_deleted=1)
        if new_perms:
            objs = [RolePermission(role_id=role_id, permission_code=p) for p in new_perms]
            await RolePermission.bulk_create(objs, using_db=conn)
    if redis:
        role = await Role.get_or_none(id=role_id)
        await redis.set(f"cache:role_perms:{role.code if role else 'UNKNOWN'}", json.dumps(new_perms))
    return {"status": "ok"}

@router.get("/notifications")
async def get_notifications(page: int = 1, size: int = 10, current_user: dict = Depends(get_current_user)):
    offset = (page - 1) * size
    query = Notification.filter(is_deleted=0)
    total = await query.count()
    data = await query.order_by("-created_at").limit(size).offset(offset).values()
    return {"status": "ok", "data": data, "total": total}

@router.post("/notifications/read")
async def mark_notification_read(data: dict, current_user: dict = Depends(get_current_user)):
    notif_id = data.get("id")
    if notif_id == "ALL": await Notification.filter(is_read=0).update(is_read=1)
    else: await Notification.filter(id=notif_id).update(is_read=1)
    return {"status": "ok"}

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

@router.get("/audit-logs")
async def get_audit_logs(page: int = 1, size: int = 15, current_user: dict = Depends(get_current_user)):
    query = AuditLog.filter(is_deleted=0)
    total = await query.count()
    data = await query.order_by("-id").offset((page - 1) * size).limit(size).values()
    return {"status": "ok", "data": data, "total": total}
