from fastapi import APIRouter, Request
from core.models import KnowledgeBase
from tortoise.expressions import Q
import json

router = APIRouter(prefix="/api/coach", tags=["Coach"])

@router.get("/advice")
async def get_coach_advice(request: Request, customer_msg: str):
    """
    [ORM + Cache 版] 动态知识库检索
    """
    redis = request.app.state.redis
    kb_items = None
    
    # 1. 尝试从缓存获取
    if redis:
        cached = await redis.get("cache:knowledge_base")
        if cached:
            kb_items = json.loads(cached)

    # 2. 缓存未命中则查库
    if kb_items is None:
        kb_items_obj = await KnowledgeBase.filter(is_active=1).all().values("keyword", "answer", "category")
        kb_items = kb_items_obj
        if redis:
            await redis.setex("cache:knowledge_base", 600, json.dumps(kb_items))
    
    # 3. 在内存中进行关键词匹配
    for item in kb_items:
        if item["keyword"] in customer_msg:
            return {
                "status": "ok",
                "data": {
                    "type": "COACH_ADVICE",
                    "title": f"带教指引：{item['category']}",
                    "content": item["answer"],
                    "voice_alert": "检测到相关业务咨询，已调取标准战术话术。"
                }
            }
    
    return {"status": "ok", "data": None}