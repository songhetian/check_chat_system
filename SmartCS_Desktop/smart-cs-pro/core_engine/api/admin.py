from fastapi import APIRouter, Query, Request
from core.models import User, Department, ViolationRecord
from tortoise.expressions import Q
import os, json

router = APIRouter(prefix="/api/admin", tags=["Admin"])

from tortoise.functions import Count

@router.get("/departments")
async def get_departments(
    request: Request,
    page: int = 1,
    size: int = 10
):
    redis = request.app.state.redis
    offset = (page - 1) * size
    
    # 强制过滤 is_deleted=0，并统计人数，同时拉取主管信息
    query = Department.filter(is_deleted=0).select_related("manager")
    
    total = await query.count()
    depts_data = await query.limit(size).offset(offset).annotate(member_count=Count("users")).values(
        "id", "name", "member_count", "manager__username", "manager__real_name"
    )
    
    return {
        "status": "ok", 
        "data": depts_data,
        "total": total
    }

@router.get("/departments/users")
async def get_department_users(
    dept_id: int,
    search: str = Query("")
):
    """搜索指定部门下的所有员工 (用于设置主管)"""
    query = User.filter(department_id=dept_id, is_deleted=0)
    if search:
        query = query.filter(Q(username__icontains=search) | Q(real_name__icontains=search))
    
    users = await query.limit(50).values("id", "username", "real_name")
    return {"status": "ok", "data": users}

@router.post("/departments")
async def create_department(data: dict, request: Request):
    name, manager_id = data.get("name"), data.get("manager_id")
    if not name:
        return {"status": "error", "message": "部门名称不能为空"}
    
    dept = await Department.create(name=name, manager_id=manager_id)
    if request.app.state.redis:
        await request.app.state.redis.delete("cache:departments")
    return {"status": "ok", "data": {"id": dept.id, "name": dept.name}}

@router.post("/departments/update")
async def update_department(data: dict, request: Request):
    dept_id, name, manager_id = data.get("id"), data.get("name"), data.get("manager_id")
    dept = await Department.get_or_none(id=dept_id, is_deleted=0)
    if not dept:
        return {"status": "error", "message": "部门不存在"}
    
    dept.name = name
    dept.manager_id = manager_id
    await dept.save()
    
    if request.app.state.redis:
        await request.app.state.redis.delete("cache:departments")
    return {"status": "ok"}

@router.post("/departments")
async def create_department(data: dict, request: Request):
    name = data.get("name")
    if not name:
        return {"status": "error", "message": "部门名称不能为空"}
    
    dept = await Department.create(name=name)
    if request.app.state.redis:
        await request.app.state.redis.delete("cache:departments")
    return {"status": "ok", "data": {"id": dept.id, "name": dept.name}}

@router.post("/departments/delete")
async def delete_department(data: dict, request: Request):
    dept_id = data.get("id")
    dept = await Department.get_or_none(id=dept_id)
    if dept:
        dept.is_deleted = 1
        await dept.save()
        if request.app.state.redis:
            await request.app.state.redis.delete("cache:departments")
    return {"status": "ok"}

@router.get("/agents")
async def get_agents(
    request: Request,
    page: int = 1, 
    size: int = 50, 
    search: str = "", 
    dept: str = "ALL", 
    status: str = "ALL"
):
    redis = request.app.state.redis
    offset = (page - 1) * size
    
    # 获取在线列表 (从 Redis)
    online_usernames = []
    if redis:
        online_usernames = await redis.smembers("online_agents_set")

    query = User.filter(is_deleted=0).select_related("department")
    if search: 
        query = query.filter(Q(username__icontains=search) | Q(real_name__icontains=search))
    
    if dept != "ALL": 
        query = query.filter(department__name=dept)
    
    # 状态过滤逻辑
    if status == "ONLINE": 
        query = query.filter(username__in=online_usernames)
    elif status == "OFFLINE": 
        query = query.exclude(username__in=online_usernames)

    total = await query.count()
    
    # 提取核心数据，并按战术评分升序排列
    agents_data = await query.order_by("tactical_score").limit(size).offset(offset).annotate(
        manage_count=Count("managed_departments")
    ).values(
        "username", "real_name", "role", "tactical_score", "department__name", "manage_count"
    )
    
    result = []
    for a in agents_data:
        last_v = await ViolationRecord.filter(user__username=a["username"], is_deleted=0).order_by("-timestamp").first()
        result.append({
            "username": a["username"],
            "real_name": a["real_name"],
            "role": a["role"],
            "dept_name": a["department__name"] or "未归类",
            "is_manager": a["manage_count"] > 0, # 判断是否为任何部门的主管
            "is_online": a["username"] in online_usernames,
            "tactical_score": a["tactical_score"],
            "last_violation_type": last_v.keyword if last_v else None,
            "last_risk_score": last_v.risk_score if last_v else 0,
            "last_violation_context": last_v.context if last_v else None,
            "last_violation_time": last_v.timestamp.isoformat() if last_v else None
        })
    return {"status": "ok", "data": result, "total": total}