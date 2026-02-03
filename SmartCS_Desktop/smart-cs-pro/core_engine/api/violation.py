from fastapi import APIRouter, Depends, Query, Request
from core.models import ViolationRecord, User, SensitiveWord
from api.auth import get_current_user
from tortoise.expressions import Q
import json

router = APIRouter(prefix="/api/admin", tags=["Violation"])

@router.get("/violations")
async def get_violations(
    request: Request,
    current_user: dict = Depends(get_current_user),
    username: str = Query(None),
    dept_id: int = Query(None),
    keyword: str = Query(None),
    risk_level: str = Query("ALL"),
    page: int = 1,
    size: int = 20
):
    """
    [实战审计] 违规记录隔离：主管锁定部门，总部全域穿透
    """
    query = ViolationRecord.filter(is_deleted=0).select_related("user", "user__department")

    if current_user["role_code"] == "ADMIN":
        query = query.filter(user__department_id=current_user["dept_id"])
    elif current_user["role_code"] == "HQ" and dept_id:
        query = query.filter(user__department_id=dept_id)

    if username:
        query = query.filter(Q(user__username__icontains=username) | Q(user__real_name__icontains=username))
    if keyword:
        query = query.filter(keyword__icontains=keyword)
    
    if risk_level == "SERIOUS": query = query.filter(risk_score__gte=8)
    elif risk_level == "MEDIUM": query = query.filter(risk_score__range=(5, 7))
    elif risk_level == "LOW": query = query.filter(risk_score__lt=5)

    total = await query.count()
    violations = await query.order_by("-timestamp").limit(size).offset((page - 1) * size).values(
        "id", "keyword", "context", "risk_score", "timestamp",
        "user__username", "user__real_name", "user__department__name"
    )

    return {"status": "ok", "data": violations, "total": total}

async def get_custom_audio(keyword: str):
    """提取该词关联的自定义声音路径"""
    sw = await SensitiveWord.get_or_none(word=keyword, is_deleted=0)
    return sw.custom_audio_path if sw else None
