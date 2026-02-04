from fastapi import APIRouter, Depends, Request
from core.models import SensitiveWord, KnowledgeBase, PolicyCategory
from api.auth import get_current_user, check_permission
from tortoise.transactions import in_transaction
import json

router = APIRouter(prefix="/api/ai", tags=["AI Policy"])

@router.get("/categories")
async def get_categories(page: int = 1, size: int = 10, type: str = None, current_user: dict = Depends(get_current_user)):
    query = PolicyCategory.filter(is_deleted=0)
    if type: query = query.filter(type=type)
    
    total = await query.count()
    data = await query.offset((page - 1) * size).limit(size).order_by("-id").values()
    return {"status": "ok", "data": data, "total": total}

@router.post("/categories")
async def save_category(data: dict, current_user: dict = Depends(check_permission("admin:policy:category"))):
    cat_id = data.get("id")
    payload = {"name": data.get("name"), "type": data.get("type"), "description": data.get("description")}
    async with in_transaction() as conn:
        if cat_id: await PolicyCategory.filter(id=cat_id).update(**payload)
        else: await PolicyCategory.create(**payload)
    return {"status": "ok"}

@router.get("/sensitive-words")
async def get_sensitive_words(page: int = 1, size: int = 10, current_user: dict = Depends(get_current_user)):
    query = SensitiveWord.filter(is_deleted=0)
    total = await query.count()
    words = await query.select_related("category").offset((page - 1) * size).limit(size).order_by("-id").values(
        "id", "word", "risk_level", "is_active", "category__name", "category_id"
    )
    return {"status": "ok", "data": words, "total": total}

@router.post("/sensitive-words")
async def save_sensitive_word(data: dict, request: Request, user: dict = Depends(check_permission("admin:ai:policy"))):
    word_id = data.get("id")
    payload = {"word": data.get("word"), "category_id": data.get("category_id"), "risk_level": data.get("risk_level", 5)}
    
    async with in_transaction() as conn:
        if word_id: await SensitiveWord.filter(id=word_id).update(**payload)
        else: await SensitiveWord.create(**payload)
        
        # 事务内同步热数据至缓存
        redis = request.app.state.redis
        if redis:
            all_words = await SensitiveWord.filter(is_active=1, is_deleted=0).values("word", "risk_level")
            await redis.set("cache:sensitive_words", json.dumps(all_words))
    return {"status": "ok"}

@router.post("/sensitive-words/import")
async def import_sensitive_words(data: dict, request: Request, user: dict = Depends(check_permission("admin:ai:policy"))):
    items = data.get("items", [])
    if not items: return {"status": "error", "message": "导入清单为空"}

    async with in_transaction() as conn:
        for item in items:
            await SensitiveWord.get_or_create(
                word=item.get("word"),
                defaults={"category_id": item.get("category_id"), "risk_level": item.get("risk_level", 5), "is_active": 1}
            )
        
        redis = request.app.state.redis
        if redis:
            all_words = await SensitiveWord.filter(is_active=1, is_deleted=0).values("word", "risk_level")
            await redis.set("cache:sensitive_words", json.dumps(all_words))
    return {"status": "ok", "count": len(items)}

@router.get("/knowledge-base")
async def get_knowledge_base(current_user: dict = Depends(get_current_user)):
    return {"status": "ok", "data": await KnowledgeBase.filter(is_deleted=0).select_related("category").all().values(
        "id", "keyword", "answer", "is_active", "category__name", "category_id"
    )}

@router.post("/knowledge-base")
async def save_knowledge_item(data: dict, request: Request, user: dict = Depends(check_permission("admin:ai:policy"))):
    item_id = data.get("id")
    payload = {"keyword": data.get("keyword"), "answer": data.get("answer"), "category_id": data.get("category_id")}
    
    async with in_transaction() as conn:
        if item_id: await KnowledgeBase.filter(id=item_id).update(**payload)
        else: await KnowledgeBase.create(**payload)

        redis = request.app.state.redis
        if redis:
            kb_data = await KnowledgeBase.filter(is_active=1, is_deleted=0).values("keyword", "answer")
            await redis.set("cache:knowledge_base", json.dumps(kb_data))
    return {"status": "ok"}
