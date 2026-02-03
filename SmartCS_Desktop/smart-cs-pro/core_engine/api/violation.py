from fastapi import APIRouter, Depends
from core.models import ViolationRecord, User
import secrets
from tortoise.transactions import in_transaction

router = APIRouter(prefix="/api", tags=["Violation"])

@router.get("/admin/violations")
async def get_violations(token: str):
    # 模拟从 token 获取用户信息
    current_user = {"role": "ADMIN", "dept_id": 2, "username": "zhang_manager"}
    
    query = ViolationRecord.filter(is_deleted=0).select_related("user", "user__department")
    
    if current_user["role"] != "HQ":
        query = query.filter(user__department__id=current_user["dept_id"])
    
    violations = await query.order_by("-timestamp").all()
    
    data = []
    for v in violations:
        data.append({
            "id": v.id,
            "username": v.user.username,
            "real_name": v.user.real_name,
            "keyword": v.keyword,
            "context": v.context,
            "risk_score": v.risk_score,
            "timestamp": v.timestamp.isoformat()
        })
    
    return {"status": "ok", "data": data}

@router.get("/hq/manager/kpi")
async def get_manager_kpis():
    """总部专用的主管战术效能排名"""
    # 模拟数据
    return [
        {"name": "销售一部主管", "response_time": "45s", "praise_rate": "85%", "rank": 1},
        {"name": "销售二部主管", "response_time": "120s", "praise_rate": "40%", "rank": 2},
    ]
