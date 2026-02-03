from fastapi import APIRouter, Query, Request
from core.models import User, Department, ViolationRecord, Role, Permission, RolePermission

@router.get("/permissions")
async def get_permissions():
    """获取全量系统权限定义"""
    perms = await Permission.filter(is_deleted=0).values("id", "code", "name", "module")
    return {"status": "ok", "data": perms}

@router.get("/role/permissions")
async def get_role_permissions(role_id: int):
    """获取指定角色的权限代码列表"""
    perms = await RolePermission.filter(role_id=role_id).values_list("permission_code", flat=True)
    return {"status": "ok", "data": list(perms)}

@router.post("/role/permissions")
async def update_role_permissions(data: dict):
    """全量覆盖更新角色权限"""
    role_id, perms = data.get("role_id"), data.get("permissions", [])
    
    async with in_transaction() as conn:
        # 先清除
        await RolePermission.filter(role_id=role_id).delete(using_db=conn)
        # 再批量插入
        objs = [RolePermission(role_id=role_id, permission_code=p) for p in perms]
        await RolePermission.bulk_create(objs, using_db=conn)
        
    return {"status": "ok"}

from tortoise.expressions import Q
from tortoise.functions import Count
import os, json

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/departments")
async def get_departments(
    request: Request,
    page: int = 1,
    size: int = 10
):
    redis = request.app.state.redis
    offset = (page - 1) * size
    
    query = Department.filter(is_deleted=0).select_related("manager")
    total = await query.count()
    depts_data = await query.limit(size).offset(offset).annotate(member_count=Count("users")).values(
        "id", "name", "member_count", "manager__username", "manager__real_name"
    )
    
    return {"status": "ok", "data": depts_data, "total": total}

@router.get("/departments/users")
async def get_department_users(dept_id: int, search: str = Query("")):
    query = User.filter(department_id=dept_id, is_deleted=0)
    if search:
        query = query.filter(Q(username__icontains=search) | Q(real_name__icontains=search))
    users = await query.limit(50).values("id", "username", "real_name")
    return {"status": "ok", "data": users}

@router.post("/departments")
async def create_department(data: dict, request: Request):
    name, manager_id = data.get("name"), data.get("manager_id")
    if not name: return {"status": "error", "message": "部门名称不能为空"}
    dept = await Department.create(name=name, manager_id=manager_id)
    if request.app.state.redis: await request.app.state.redis.delete("cache:departments")
    return {"status": "ok", "data": {"id": dept.id, "name": dept.name}}

@router.post("/departments/update")
async def update_department(data: dict, request: Request):
    dept_id, name, manager_id = data.get("id"), data.get("name"), data.get("manager_id")
    dept = await Department.get_or_none(id=dept_id, is_deleted=0)
    if not dept: return {"status": "error", "message": "部门不存在"}
    dept.name = name
    dept.manager_id = manager_id
    await dept.save()
    if request.app.state.redis: await request.app.state.redis.delete("cache:departments")
    return {"status": "ok"}

@router.post("/departments/delete")
async def delete_department(data: dict, request: Request):
    dept_id = data.get("id")
    dept = await Department.get_or_none(id=dept_id)
    if dept:
        dept.is_deleted = 1
        await dept.save()
        if request.app.state.redis: await request.app.state.redis.delete("cache:departments")
    return {"status": "ok"}

@router.get("/agents")
async def get_agents(request: Request, page: int = 1, size: int = 50, search: str = "", dept: str = "ALL", status: str = "ALL"):
    redis = request.app.state.redis
    offset = (page - 1) * size
    online_usernames = await redis.smembers("online_agents_set") if redis else []

    query = User.filter(is_deleted=0).select_related("department", "role")
    if search: query = query.filter(Q(username__icontains=search) | Q(real_name__icontains=search))
    if dept != "ALL": query = query.filter(department__name=dept)
    
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
            "last_risk_score": last_v.risk_score if last_v else 0,
            "last_violation_context": last_v.context if last_v else None,
            "last_violation_time": last_v.timestamp.isoformat() if last_v else None
        })
    return {"status": "ok", "data": result, "total": total}

@router.get("/roles")
async def get_roles():
    roles = await Role.filter(is_deleted=0).values("id", "name", "code")
    return {"status": "ok", "data": roles}

@router.get("/permissions")
async def get_permissions():
    """获取全量系统权限定义"""
    perms = await Permission.filter(is_deleted=0).values("id", "code", "name", "module")
    return {"status": "ok", "data": perms}

@router.get("/role/permissions")
async def get_role_permissions(role_id: int):
    """获取指定角色的权限代码列表"""
    perms = await RolePermission.filter(role_id=role_id).values_list("permission_code", flat=True)
    return {"status": "ok", "data": list(perms)}

@router.post("/role/permissions")
async def update_role_permissions(data: dict, request: Request):
    """全量覆盖更新角色权限，并广播通知"""
    role_id, new_perms = data.get("role_id"), data.get("permissions", [])
    redis = request.app.state.redis
    
    # 1. 获取旧权限集进行比对
    old_perms = await RolePermission.filter(role_id=role_id).values_list("permission_code", flat=True)
    added = set(new_perms) - set(old_perms)
    removed = set(old_perms) - set(new_perms)

    async with in_transaction() as conn:
        await RolePermission.filter(role_id=role_id).delete(using_db=conn)
        if new_perms:
            objs = [RolePermission(role_id=role_id, permission_code=p) for p in new_perms]
            await RolePermission.bulk_create(objs, using_db=conn)
    
    # 2. 广播权限变更信号
    if redis and (added or removed):
        role = await Role.get_or_none(id=role_id)
        role_code = role.code if role else "UNKNOWN"
        
        all_perms_map = {p['code']: p['name'] for p in await Permission.all().values("code", "name")}
        
        msg_parts = []
        if added: msg_parts.append(f"新增功能：{', '.join([all_perms_map.get(p, p) for p in added])}")
        if removed: msg_parts.append(f"移除功能：{', '.join([all_perms_map.get(p, p) for p in removed])}")
        
        payload = {
            "type": "PERMISSION_CHANGED",
            "target_role": role_code,
            "title": "系统权责变更提醒",
            "message": "您的权责矩阵已重校",
            "details": " | ".join(msg_parts)
        }
        await redis.publish("notif_channel", json.dumps(payload))
        
    return {"status": "ok"}
