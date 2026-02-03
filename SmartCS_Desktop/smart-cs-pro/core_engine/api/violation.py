from fastapi import APIRouter, Depends, Query, Request
from core.models import ViolationRecord, User
from tortoise.expressions import Q
import secrets

router = APIRouter(prefix="/api/admin", tags=["Violation"])

@router.get("/violations")
async def get_violations(
    request: Request,
    username: str = Query(None),
    dept_id: int = Query(None),
    keyword: str = Query(None),
    risk_level: str = Query("ALL"),
    page: int = 1,
    size: int = 20
):
    # 1. 模拟 RBAC 权限 (实际应从 JWT Token 获取)
    # 假设当前登录用户的角色和部门信息通过 Request 获取
    # current_user = {"role": "ADMIN", "dept_id": 2} 
    current_user = {"role": "HQ", "dept_id": None} # 演示用超级管理员

    query = ViolationRecord.filter(is_deleted=0).select_related("user", "user__department")

    # 2. 核心数据隔离逻辑
    if current_user["role"] != "HQ":
        # 部门主管只能看到自己部门的数据
        query = query.filter(user__department__id=current_user["dept_id"])

    # 3. 动态搜索条件
    if username:
        query = query.filter(Q(user__username__icontains=username) | Q(user__real_name__icontains=username))
    if dept_id and current_user["role"] == "HQ": # 只有总部能跨部门搜
        query = query.filter(user__department__id=dept_id)
    if keyword:
        query = query.filter(keyword__icontains=keyword)
    
    if risk_level == "SERIOUS":
        query = query.filter(risk_score__gte=8)
    elif risk_level == "MEDIUM":
        query = query.filter(risk_score__range=(5, 7))
    elif risk_level == "LOW":
        query = query.filter(risk_score__lt=5)

    # 4. 分页与排序
    total = await query.count()
    violations = await query.order_by("-timestamp").limit(size).offset((page - 1) * size).values(
        "id", "keyword", "context", "risk_score", "timestamp",
        "user__username", "user__real_name", "user__department__name"
    )

    return {
        "status": "ok", 
        "data": violations,
        "total": total
    }

@router.get("/hq/manager/kpi")
async def get_manager_kpis():
    """总部专用的主管战术效能排名"""
    return [
        {"name": "销售一部主管", "response_time": "45s", "praise_rate": "85%", "rank": 1},
        {"name": "销售二部主管", "response_time": "120s", "praise_rate": "40%", "rank": 2},
    ]