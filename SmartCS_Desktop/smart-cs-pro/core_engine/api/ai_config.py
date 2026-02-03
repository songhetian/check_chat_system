from fastapi import APIRouter, Depends, Request
from core.models import SensitiveWord, KnowledgeBase, PolicyCategory
from api.auth import get_current_user
import json

router = APIRouter(prefix="/api/ai", tags=["AI Policy"])

# --- 1. 策略分类管理 ---
@router.get("/categories")
async def get_categories(type: str = None, current_user: dict = Depends(get_current_user)):
    query = PolicyCategory.filter(is_deleted=0)
    if type: query = query.filter(type=type)
    data = await query.all().values()
    return {"status": "ok", "data": data}

@router.post("/categories")
async def save_category(data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role_code"] != "HQ": return {"status": "error", "message": "权限不足"}
    cat_id = data.get("id")
    payload = {"name": data.get("name"), "type": data.get("type"), "description": data.get("description")}
    if cat_id: await PolicyCategory.filter(id=cat_id).update(**payload)
    else: await PolicyCategory.create(**payload)
    return {"status": "ok"}

# --- 2. 敏感词管理 (实体关联版) ---
@router.get("/sensitive-words")
async def get_sensitive_words(current_user: dict = Depends(get_current_user)):
    # 关联查询分类名称
    words = await SensitiveWord.filter(is_deleted=0).select_related("category").all().values(
        "id", "word", "risk_level", "is_active", "category__name", "category_id"
    )
    return {"status": "ok", "data": words}

@router.post("/sensitive-words")
async def save_sensitive_word(data: dict, request: Request, current_user: dict = Depends(get_current_user)):
    if current_user["role_code"] != "HQ": return {"status": "error", "message": "权限不足"}
    word_id = data.get("id")
    payload = {
        "word": data.get("word"),
        "category_id": data.get("category_id"),
        "risk_level": data.get("risk_level", 5),
        "is_active": data.get("is_active", 1)
    }
    if word_id: await SensitiveWord.filter(id=word_id).update(**payload)
    else: await SensitiveWord.create(**payload)
    
    # 同步 Redis 战术缓存
    redis = request.app.state.redis
    if redis:
        all_words = await SensitiveWord.filter(is_active=1, is_deleted=0).values("word", "risk_level")
        await redis.set("cache:sensitive_words", json.dumps(all_words))
    return {"status": "ok"}

# --- 3. 智能话术管理 (实体关联版) ---
@router.get("/knowledge-base")
async def get_knowledge_base(current_user: dict = Depends(get_current_user)):
    items = await KnowledgeBase.filter(is_deleted=0).select_related("category").all().values(
        "id", "keyword", "answer", "is_active", "category__name", "category_id"
    )
    return {"status": "ok", "data": items}

@router.post("/knowledge-base")
async def save_knowledge_item(data: dict, request: Request, current_user: dict = Depends(get_current_user)):
    if current_user["role_code"] != "HQ": return {"status": "error", "message": "权限不足"}
    item_id = data.get("id")
    payload = {
        "keyword": data.get("keyword"),
        "answer": data.get("answer"),
        "category_id": data.get("category_id"),
        "is_active": data.get("is_active", 1)
    }
    if item_id: await KnowledgeBase.filter(id=item_id).update(**payload)
    else: await KnowledgeBase.create(**payload)

    # 同步 Redis
    redis = request.app.state.redis
    if redis:
        kb_data = await KnowledgeBase.filter(is_active=1, is_deleted=0).values("keyword", "answer")
        await redis.set("cache:knowledge_base", json.dumps(kb_data))
    return {"status": "ok"}