from fastapi import APIRouter, Query, Request, Depends
from core.models import User, Department, ViolationRecord, Role, Permission, RolePermission
from api.auth import get_current_user
from tortoise.expressions import Q
from tortoise.functions import Count
from tortoise.transactions import in_transaction
import os, json

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/departments")
async def get_departments(
    request: Request,
    current_user: dict = Depends(get_current_user),
    page: int = 1,
    size: int = 10
):
    """
    [红线审计] 获取部门列表：总部可见全量，主管仅可见所属
    """
    offset = (page - 1) * size
    query = Department.filter(is_deleted=0).select_related("manager")
    
    # 数据隔离逻辑
    if current_user["role_code"] == "ADMIN":
        query = query.filter(id=current_user["dept_id"])
    
    total = await query.count()
    depts_data = await query.limit(size).offset(offset).annotate(member_count=Count("users")).values(
        "id", "name", "member_count", "manager__username", "manager__real_name"
    )
    
    return {"status": "ok", "data": depts_data, "total": total}

@router.get("/agents")
async def get_agents(
    request: Request, 
    current_user: dict = Depends(get_current_user),
    page: int = 1, 
    size: int = 50, 
    search: str = "", 
    dept: str = "ALL", 
    status: str = "ALL"
):
    """
    [红线审计] 成员矩阵隔离：强制限定 ADMIN 只能查看本部门员工
    """
    redis = request.app.state.redis
    offset = (page - 1) * size
    online_usernames = await redis.smembers("online_agents_set") if redis else []

    query = User.filter(is_deleted=0).select_related("department", "role")
    
    # 强制数据隔离红线
    if current_user["role_code"] == "ADMIN":
        query = query.filter(department_id=current_user["dept_id"])
    elif current_user["role_code"] == "HQ" and dept != "ALL":
        query = query.filter(department__name=dept)

    if search: 
        query = query.filter(Q(username__icontains=search) | Q(real_name__icontains=search))
    
    if status == "ONLINE": query = query.filter(username__in=online_usernames)
    elif status == "OFFLINE": query = query.exclude(username__in=online_usernames)

    total = await query.count()
    agents_data = await query.order_by("tactical_score").limit(size).offset(offset).annotate(
        manage_count=Count("managed_departments")
    ).values(
        "username", "real_name", "role_id", "role__name", "role__code", "tactical_score", "department__name", "manage_count"
    )
    
    result = []
    for a in agents_data:
        last_v = await ViolationRecord.filter(user__username=a["username"], is_deleted=0).order_by("-timestamp").first()
        result.append({
            "username": a["username"], "real_name": a["real_name"],
            "role_id": a["role_id"], "role_name": a["role__name"], "role_code": a["role__code"],
            "dept_name": a["department__name"] or "未归类",
            "is_manager": a["manage_count"] > 0, "is_online": a["username"] in online_usernames,
            "tactical_score": a["tactical_score"],
            "last_violation_type": last_v.keyword if last_v else None,
            "last_risk_score": last_v.risk_score if last_v else 0
        })
    return {"status": "ok", "data": result, "total": total}

@router.get("/roles")
async def get_roles(current_user: dict = Depends(get_current_user)):
    roles = await Role.filter(is_deleted=0).values("id", "name", "code")
    return {"status": "ok", "data": roles}

@router.get("/permissions")
async def get_permissions(current_user: dict = Depends(get_current_user)):
    perms = await Permission.filter(is_deleted=0).values("id", "code", "name", "module")
    return {"status": "ok", "data": perms}

@router.get("/role/permissions")
async def get_role_permissions(role_id: int, current_user: dict = Depends(get_current_user)):
    perms = await RolePermission.filter(role_id=role_id).values_list("permission_code", flat=True)
    return {"status": "ok", "data": list(perms)}

@router.post("/role/permissions")
async def update_role_permissions(data: dict, request: Request, current_user: dict = Depends(get_current_user)):
    # 仅限总部操作
    if current_user["role_code"] != "HQ":
        return {"status": "error", "message": "权限不足：仅限总部管理员操作"}
        
    role_id, new_perms = data.get("role_id"), data.get("permissions", [])
    redis = request.app.state.redis
    
    old_perms = await RolePermission.filter(role_id=role_id).values_list("permission_code", flat=True)
    added = set(new_perms) - set(old_perms)
    removed = set(old_perms) - set(new_perms)

    async with in_transaction() as conn:
        await RolePermission.filter(role_id=role_id).delete(using_db=conn)
        if new_perms:
            objs = [RolePermission(role_id=role_id, permission_code=p) for p in new_perms]
            await RolePermission.bulk_create(objs, using_db=conn)
    
    if redis and (added or removed):
        role = await Role.get_or_none(id=role_id)
        role_code = role.code if role else "UNKNOWN"
        all_perms_map = {p['code']: p['name'] for p in await Permission.all().values("code", "name")}
        msg_parts = []
        if added: msg_parts.append(f"新增：{', '.join([all_perms_map.get(p, p) for p in added])}")
        if removed: msg_parts.append(f"移除：{', '.join([all_perms_map.get(p, p) for p in removed])}")
        
        payload = {"type": "PERMISSION_CHANGED", "target_role": role_code, "title": "权责重校提醒", "message": "矩阵已实时对齐", "details": " | ".join(msg_parts)}
        await redis.publish("notif_channel", json.dumps(payload))
        
    return {"status": "ok"}
