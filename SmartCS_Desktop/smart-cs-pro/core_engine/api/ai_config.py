from fastapi import APIRouter, Depends, Request, Query, HTTPException
from core.models import SensitiveWord, KnowledgeBase, PolicyCategory, AuditLog, CustomerSentiment, DeptSensitiveWord, DeptComplianceLog
from api.auth import get_current_user, check_permission
from tortoise.transactions import in_transaction
from tortoise.expressions import Q
import json

router = APIRouter(prefix="/api/ai", tags=["AI Policy"])

async def record_audit(operator: str, action: str, target: str, details: str):
    await AuditLog.create(operator=operator, action=action, target=target, details=details)

@router.get("/sentiments")
async def get_sentiments(current_user: dict = Depends(check_permission("admin:sentiment:view"))):
    """[物理拉取] 获取动态客户情绪标签集"""
    data = await CustomerSentiment.filter(is_deleted=0).order_by("id").values()
    return {"status": "ok", "data": data}

# ... (sentiments POST/DELETE remain same as they already have check_permission)

@router.get("/dept-words")
async def get_dept_words(page: int = 1, size: int = 10, search: str = "", current_user: dict = Depends(check_permission("admin:dept_word:view"))):
    query = DeptSensitiveWord.filter(is_deleted=0)
    role_id = current_user.get("role_id")
    dept_id = current_user.get("dept_id")
    
    if role_id != 3:
        query = query.filter(Q(department_id__isnull=True) | Q(department_id=dept_id))
    
    if search:
        query = query.filter(word__icontains=search)
        
    total = await query.count()
    data = await query.select_related("category", "department").offset((page - 1) * size).limit(size).order_by("-id").values(
        "id", "word", "suggestion", "category__name", "category_id", "department_id", "department__name", "is_active"
    )
    return {"status": "ok", "data": data, "total": total}

@router.post("/dept-words")
async def save_dept_word(data: dict, user: dict = Depends(check_permission("admin:dept_word:create"))):
    item_id = data.get("id")
    role_id = user.get("role_id")
    dept_id = user.get("dept_id")
    
    if item_id and "admin:dept_word:update" not in user.get("permissions", []):
        raise HTTPException(status_code=403, detail="越权拦截：缺失更新权限")

    target_dept_id = data.get("department_id")
    if role_id != 3: target_dept_id = dept_id
    elif not target_dept_id or target_dept_id == 'GLOBAL': target_dept_id = None

    payload = {
        "word": data.get("word"), 
        "suggestion": data.get("suggestion"), 
        "category_id": data.get("category_id"),
        "department_id": target_dept_id
    }

    async with in_transaction() as conn:
        if item_id: await DeptSensitiveWord.filter(id=item_id).update(**payload)
        else: await DeptSensitiveWord.create(**payload)
        await record_audit(user["real_name"], "DEPT_WORD_SAVE", data.get("word"), "更新部门合规词库")
    return {"status": "ok"}

@router.post("/dept-words/delete")
async def delete_dept_word(data: dict, user: dict = Depends(check_permission("admin:dept_word:delete"))):
    item_id = data.get("id")
    async with in_transaction() as conn:
        await DeptSensitiveWord.filter(id=item_id).update(is_deleted=1)
        await record_audit(user["real_name"], "DEPT_WORD_DELETE", f"ID:{item_id}", "移除部门合规词")
    return {"status": "ok"}

@router.get("/compliance-logs")
async def get_compliance_logs(page: int = 1, size: int = 15, current_user: dict = Depends(check_permission("audit:dept:log:view"))):
    query = DeptComplianceLog.filter()
    if current_user.get("role_id") != 3:
        query = query.filter(department_id=current_user.get("dept_id"))
    
    total = await query.count()
    data = await query.select_related("user", "department").offset((page - 1) * size).limit(size).order_by("-timestamp").values(
        "id", "word", "context", "timestamp", "user__real_name", "department__name"
    )
    return {"status": "ok", "data": data, "total": total}

@router.get("/categories")
async def get_categories(page: int = 1, size: int = 10, type: str = None, current_user: dict = Depends(check_permission("admin:cat:view"))):
    query = PolicyCategory.filter(is_deleted=0)
    if type: query = query.filter(type=type)
    total = await query.count()
    data = await query.offset((page - 1) * size).limit(size).order_by("-id").values()
    return {"status": "ok", "data": data, "total": total}

@router.post("/categories")
async def save_category(data: dict, user: dict = Depends(check_permission("admin:cat:create"))):
    cat_id = data.get("id")
    if cat_id and "admin:cat:update" not in user.get("permissions", []):
        raise HTTPException(status_code=403, detail="权限熔断：缺失分类更新权限")
        
    payload = {"name": data.get("name"), "type": data.get("type"), "description": data.get("description")}
    async with in_transaction() as conn:
        if cat_id: await PolicyCategory.filter(id=cat_id).update(**payload)
        else: await PolicyCategory.create(**payload)
        await record_audit(user["real_name"], "CAT_SAVE", data.get("name"), "固化策略分类节点")
    return {"status": "ok"}

@router.post("/categories/delete")
async def delete_category(data: dict, user: dict = Depends(check_permission("admin:cat:delete"))):
    cat_id = data.get("id")
    async with in_transaction() as conn:
        await PolicyCategory.filter(id=cat_id).update(is_deleted=1)
        await record_audit(user["real_name"], "CAT_DELETE", f"ID:{cat_id}", "注销策略分类")
    return {"status": "ok"}

@router.get("/sensitive-words")
async def get_sensitive_words(page: int = 1, size: int = 10, current_user: dict = Depends(check_permission("admin:ai:view"))):
    query = SensitiveWord.filter(is_deleted=0)
    total = await query.count()
    words = await query.select_related("category").offset((page - 1) * size).limit(size).order_by("-id").values(
        "id", "word", "risk_level", "is_active", "category__name", "category_id"
    )
    return {"status": "ok", "data": words, "total": total}

@router.post("/sensitive-words")
async def save_sensitive_word(data: dict, request: Request, user: dict = Depends(check_permission("admin:ai:create"))):
    word_id = data.get("id")
    if word_id and "admin:ai:update" not in user.get("permissions", []):
        raise HTTPException(status_code=403, detail="权限熔断：缺失策略更新权限")

    payload = {"word": data.get("word"), "category_id": data.get("category_id"), "risk_level": data.get("risk_level", 5)}
    async with in_transaction() as conn:
        if word_id: await SensitiveWord.filter(id=word_id).update(**payload)
        else: await SensitiveWord.create(**payload)
        
        redis = request.app.state.redis
        if redis:
            all_words = await SensitiveWord.filter(is_active=1, is_deleted=0).values("word", "risk_level")
            await redis.set("cache:sensitive_words", json.dumps(all_words))
        await record_audit(user["real_name"], "WORD_SAVE", data.get("word"), "更新全域敏感词库")
    return {"status": "ok"}

@router.post("/sensitive-words/delete")
async def delete_sensitive_word(data: dict, request: Request, user: dict = Depends(check_permission("admin:ai:delete"))):
    w_id = data.get("id")
    async with in_transaction() as conn:
        w = await SensitiveWord.get(id=w_id)
        await SensitiveWord.filter(id=w_id).update(is_deleted=1)
        
        redis = request.app.state.redis
        if redis:
            all_words = await SensitiveWord.filter(is_active=1, is_deleted=0).values("word", "risk_level")
            await redis.set("cache:sensitive_words", json.dumps(all_words))
        await record_audit(user["real_name"], "WORD_DELETE", w.word, "注销全域敏感词")
    return {"status": "ok"}

@router.get("/knowledge-base")
async def get_knowledge_base(
    page: int = 1, size: int = 10, search: str = "", 
    current_user: dict = Depends(check_permission("admin:ai:view"))
):
    query = KnowledgeBase.filter(is_deleted=0)
    role_id = current_user.get("role_id")
    dept_id = current_user.get("dept_id")
    
    if role_id != 3:
        query = query.filter(Q(department_id__isnull=True) | Q(department_id=dept_id))
    
    if search:
        query = query.filter(Q(keyword__icontains=search) | Q(answer__icontains=search))
        
    total = await query.count()
    data = await query.select_related("category", "department").offset((page - 1) * size).limit(size).order_by("-id").values(
        "id", "keyword", "answer", "is_active", "category__name", "category_id", "department_id", "department__name"
    )
    return {"status": "ok", "data": data, "total": total}
    role_id = current_user.get("role_id")
    dept_id = current_user.get("dept_id")
    
    if role_id != 3:
        query = query.filter(Q(department_id__isnull=True) | Q(department_id=dept_id))
    
    if search:
        query = query.filter(Q(keyword__icontains=search) | Q(answer__icontains=search))
        
    total = await query.count()
    data = await query.select_related("category", "department").offset((page - 1) * size).limit(size).order_by("-id").values(
        "id", "keyword", "answer", "is_active", "category__name", "category_id", "department_id", "department__name"
    )
    return {"status": "ok", "data": data, "total": total}

@router.post("/knowledge-base/delete")
async def delete_knowledge_item(data: dict, request: Request, user: dict = Depends(check_permission("admin:ai:delete"))):
    item_id = data.get("id")
    role_id = user.get("role_id")
    dept_id = user.get("dept_id")
    
    async with in_transaction() as conn:
        k = await KnowledgeBase.get_or_none(id=item_id)
        if not k: return {"status": "error", "message": "话术不存在"}
        
        if role_id != 3 and k.department_id != dept_id:
            raise HTTPException(status_code=403, detail="越权拦截：严禁删除非本部门或全局话术")

        await KnowledgeBase.filter(id=item_id).update(is_deleted=1)
        
        redis = request.app.state.redis
        if redis:
            kb_data = await KnowledgeBase.filter(is_active=1, is_deleted=0).values("keyword", "answer")
            await redis.set("cache:knowledge_base", json.dumps(kb_data))
        await record_audit(user["real_name"], "KB_DELETE", k.keyword, "注销智能话术节点")
    return {"status": "ok"}

@router.post("/knowledge-base")
async def save_knowledge_item(data: dict, request: Request, user: dict = Depends(check_permission("admin:ai:create"))):
    item_id = data.get("id")
    role_id = user.get("role_id")
    dept_id = user.get("dept_id")
    
    if item_id and "admin:ai:update" not in user.get("permissions", []):
        raise HTTPException(status_code=403, detail="权限熔断：缺失策略更新权限")

    target_dept_id = data.get("department_id")
    if role_id != 3: target_dept_id = dept_id
    elif not target_dept_id or target_dept_id == 'GLOBAL': target_dept_id = None

    payload = {
        "keyword": data.get("keyword"), 
        "answer": data.get("answer"), 
        "category_id": data.get("category_id"),
        "department_id": target_dept_id
    }

    async with in_transaction() as conn:
        if item_id: 
            k_old = await KnowledgeBase.get_or_none(id=item_id)
            if role_id != 3 and k_old and k_old.department_id != dept_id:
                raise HTTPException(status_code=403, detail="越权拦截：严禁修改非本部门或公共话术")
            await KnowledgeBase.filter(id=item_id).update(**payload)
        else: 
            await KnowledgeBase.create(**payload)

        redis = request.app.state.redis
        if redis:
            kb_data = await KnowledgeBase.filter(is_active=1, is_deleted=0).values("keyword", "answer")
            await redis.set("cache:knowledge_base", json.dumps(kb_data))
        await record_audit(user["real_name"], "KB_SAVE", data.get("keyword"), "固化智能话术矩阵")

    return {"status": "ok"}