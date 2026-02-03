from fastapi import APIRouter, Query, Request
from core.models import User, Department, ViolationRecord
from tortoise.expressions import Q
import os, json

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/departments")
async def get_departments(request: Request):
    redis = request.app.state.redis
    if redis:
        cached = await redis.get("cache:departments")
        if cached:
            return {"status": "ok", "data": json.loads(cached), "from_cache": True}

    data = await Department.filter(is_deleted=0).values("id", "name")
    
    if redis:
        await redis.setex("cache:departments", 3600, json.dumps(data))
        
    return {"status": "ok", "data": data}

@router.get("/agents")
async def get_agents(
    request: Request,
    page: int = 1, 
    size: int = 10, 
    search: str = "", 
    dept: str = "ALL", 
    status: str = "ALL", 
    risk_level: str = "ALL"
):
    redis = request.app.state.redis
    offset = (page - 1) * size
    
    # 优化：使用 SMEMBERS 替代 keys()
    online_usernames = []
    if redis:
        online_usernames = await redis.smembers("online_agents_set")

    query = User.filter(is_deleted=0).select_related("department")
    if search: 
        query = query.filter(Q(username__icontains=search) | Q(real_name__icontains=search))
    
    if dept != "ALL": 
        query = query.filter(department__name=dept)
    
    if status == "ONLINE": 
        query = query.filter(username__in=online_usernames)
    elif status == "OFFLINE": 
        query = query.exclude(username__in=online_usernames)

    total = await query.count()
    
    # 优化：仅选择需要的字段
    agents_data = await query.limit(size).offset(offset).values(
        "username", "real_name", "role", "tactical_score", "department__name"
    )
    
    result = []
    for a in agents_data:
        # 优化建议：如果是大列表，建议将最后违规信息也缓存或批量查询，这里暂保持逻辑
        last_v = await ViolationRecord.filter(user__username=a["username"], is_deleted=0).order_by("-timestamp").first()
        result.append({
            "username": a["username"],
            "real_name": a["real_name"],
            "role": a["role"],
            "dept_name": a["department__name"] or "未归类",
            "is_online": a["username"] in online_usernames,
            "tactical_score": a["tactical_score"],
            "last_violation_type": last_v.keyword if last_v else None,
            "last_risk_score": last_v.risk_score if last_v else 0
        })
    return {"status": "ok", "data": result, "total": total}
