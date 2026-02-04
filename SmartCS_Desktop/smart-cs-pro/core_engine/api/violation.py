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
    [实战审计] 违规记录隔离：主管锁定部门，总部全域穿透，坐席强制自看
    """
    query = ViolationRecord.filter(is_deleted=0).select_related("user", "user__department")

    # 核心：物理隔离逻辑
    if current_user["role_code"] == "AGENT":
        # 坐席身份：强制锁定本人 username，无视前端传参
        query = query.filter(user__username=current_user["username"])
    elif current_user["role_code"] == "ADMIN":
        # 主管身份：锁定本部门
        query = query.filter(user__department_id=current_user["dept_id"])
        if username: # 主管可在部门内搜人
            query = query.filter(Q(user__username__icontains=username) | Q(user__real_name__icontains=username))
    elif current_user["role_code"] == "HQ" and dept_id:
        # 总部身份：全域穿透
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

@router.post("/violation/resolve")
async def resolve_violation(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    [战术对齐] 标记违规已解决，并注入贡献奖励 (+2 PT)
    """
    v_id, solution = data.get("id"), data.get("solution")
    v = await ViolationRecord.get_or_none(id=v_id).select_related("user")
    
    if v:
        # 1. 持久化解决方案
        v.solution = solution
        v.status = "RESOLVED"
        await v.save()
        
        # 2. 注入贡献奖励：通过事务补回分数
        from core.services import grant_user_reward
        await grant_user_reward(v.user.id, 'SCORE', '解决库贡献奖', 2)
        
        return {"status": "ok", "message": "战术解决库已同步，奖励 2 PT 已发放"}
    return {"status": "error", "message": "未找到相关记录"}

async def get_custom_audio(keyword: str):
    """提取该词关联的自定义声音路径"""
    sw = await SensitiveWord.get_or_none(word=keyword, is_deleted=0)
    return sw.custom_audio_path if sw else None
