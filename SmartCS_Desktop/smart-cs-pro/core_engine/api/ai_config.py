from fastapi import APIRouter, Depends, Request
from core.models import SensitiveWord, KnowledgeBase
from api.auth import get_current_user
import json

router = APIRouter(prefix="/api/ai", tags=["AI Policy"])

@router.get("/sensitive-words")
async def get_sensitive_words(current_user: dict = Depends(get_current_user)):
    words = await SensitiveWord.filter(is_deleted=0).all().values()
    return {"status": "ok", "data": words}

@router.post("/sensitive-words")
async def save_sensitive_word(data: dict, request: Request, current_user: dict = Depends(get_current_user)):
    if current_user["role_code"] != "HQ":
        return {"status": "error", "message": "权限不足：仅限总部管理员配置"}
    
    word_id = data.get("id")
    payload = {
        "word": data.get("word"),
        "category": data.get("category"),
        "risk_level": data.get("risk_level", 5),
        "is_active": data.get("is_active", 1)
    }

    if word_id:
        await SensitiveWord.filter(id=word_id).update(**payload)
    else:
        await SensitiveWord.create(**payload)
    
    # 同步至 Redis 战术缓存，供扫描引擎秒级调用
    redis = request.app.state.redis
    if redis:
        all_words = await SensitiveWord.filter(is_active=1, is_deleted=0).values("word", "risk_level")
        await redis.set("cache:sensitive_words", json.dumps(all_words))
        await redis.publish("notif_channel", json.dumps({"type": "AI_POLICY_UPDATED", "module": "SENSITIVE_WORDS"}))

    return {"status": "ok"}

@router.get("/knowledge-base")
async def get_knowledge_base(current_user: dict = Depends(get_current_user)):
    items = await KnowledgeBase.filter(is_deleted=0).all().values()
    return {"status": "ok", "data": items}

@router.post("/knowledge-base")
async def save_knowledge_item(data: dict, request: Request, current_user: dict = Depends(get_current_user)):
    if current_user["role_code"] != "HQ":
        return {"status": "error", "message": "权限不足：仅限总部管理员配置"}
    
    item_id = data.get("id")
    payload = {
        "keyword": data.get("keyword"),
        "answer": data.get("answer"),
        "category": data.get("category"),
        "is_active": data.get("is_active", 1)
    }

    if item_id:
        await KnowledgeBase.filter(id=item_id).update(**payload)
    else:
        await KnowledgeBase.create(**payload)

    # 同步至 Redis
    redis = request.app.state.redis
    if redis:
        kb_data = await KnowledgeBase.filter(is_active=1, is_deleted=0).values("keyword", "answer")
        await redis.set("cache:knowledge_base", json.dumps(kb_data))
        await redis.publish("notif_channel", json.dumps({"type": "AI_POLICY_UPDATED", "module": "KNOWLEDGE_BASE"}))

    return {"status": "ok"}
