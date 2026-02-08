from fastapi import APIRouter, Depends, Request, Query, HTTPException
from core.models import SensitiveWord, KnowledgeBase, PolicyCategory, AuditLog, CustomerSentiment, DeptSensitiveWord, DeptComplianceLog, VoiceAlert, BusinessSOP, Department
from api.auth import get_current_user, check_permission
from tortoise.transactions import in_transaction
from tortoise.expressions import Q
import json

router = APIRouter(prefix="/api/ai", tags=["AI Policy"])

async def record_audit(operator: str, action: str, target: str, details: str):
    await AuditLog.create(operator=operator, action=action, target=target, details=details)

from fastapi import APIRouter, Depends, Request, Query, HTTPException, UploadFile, File
import shutil, os, uuid
# ... (保持原有导入)

@router.post("/sops/upload")
async def upload_sop_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """[物理载荷] 处理 SOP 附件上传 (支持图片、文档、视频)"""
    try:
        # 获取绝对路径
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        upload_dir = os.path.join(base_dir, "assets", "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        
        # 扩展物理校验：允许视频格式
        ext = os.path.splitext(file.filename)[1].lower()
        allowed_exts = [
            '.jpg', '.jpeg', '.png', '.gif', '.webp', 
            '.md', '.pdf', '.doc', '.docx', '.xlsx', '.xls', '.ppt', '.pptx', '.zip',
            '.mp4', '.webm', '.mov', '.avi'
        ]
        
        if ext not in allowed_exts:
            return {"status": "error", "message": f"物理拦截：不支持的格式 {ext}"}

        # 生成唯一文件名
        new_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(upload_dir, new_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {
            "status": "ok", 
            "url": f"/assets/uploads/{new_filename}",
            "filename": file.filename,
            "type": ext.replace('.', '').upper()
        }
    except Exception as e:
        return {"status": "error", "message": f"物理存储异常: {str(e)}"}

@router.get("/voice-alerts")
async def get_voice_alerts(page: int = 1, size: int = 50, search: str = "", current_user: dict = Depends(get_current_user)):
    dept_id = current_user.get("dept_id")
    # 强制物理隔离：仅能查看本部门数据，不再区分是否为超级管理员
    query = VoiceAlert.filter(is_deleted=0, department_id=dept_id)
    
    if search:
        query = query.filter(content__icontains=search)
    total = await query.count()
    data = await query.offset((page - 1) * size).limit(size).order_by("-id").values("id", "content", "department_id")
    return {"status": "ok", "data": data, "total": total}

@router.post("/voice-alerts")
async def save_voice_alert(data: dict, user: dict = Depends(check_permission("admin:voice:create"))):
    item_id = data.get("id")
    content = data.get("content")
    dept_id = user.get("dept_id")

    if item_id and "admin:voice:update" not in user.get("permissions", []):
        raise HTTPException(status_code=403, detail="越权拦截：缺失语音更新权限")

    async with in_transaction() as conn:
        if item_id:
            v_old = await VoiceAlert.get_or_none(id=item_id)
            if not v_old: return {"status": "error", "message": "语音节点不存在"}
            # 严格校验：禁止跨部门修改
            if v_old.department_id != dept_id:
                raise HTTPException(status_code=403, detail="越权拦截：严禁修改非本部门语音")
            
            await VoiceAlert.filter(id=item_id).update(content=content)
            await record_audit(user["real_name"], "VOICE_UPDATE", content, f"更新本部门语音项 [ID:{item_id}]")
        else:
            # 默认归属于操作员所属部门
            exists = await VoiceAlert.filter(content=content, department_id=dept_id, is_deleted=0).exists()
            if not exists:
                await VoiceAlert.create(content=content, department_id=dept_id)
                await record_audit(user["real_name"], "VOICE_CREATE", content, "录入本部门战术语音")
            return {"status": "ok", "message": "已同步至部门语音库"}
    return {"status": "ok"}

@router.post("/voice-alerts/delete")
async def delete_voice_alert(data: dict, user: dict = Depends(check_permission("admin:voice:delete"))):
    item_id = data.get("id")
    dept_id = user.get("dept_id")
    
    async with in_transaction() as conn:
        v = await VoiceAlert.get_or_none(id=item_id)
        if not v: return {"status": "error", "message": "语音项不存在"}
        
        # 严格校验：禁止跨部门删除
        if v.department_id != dept_id:
            raise HTTPException(status_code=403, detail="越权拦截：严禁注销跨部门语音")

        await VoiceAlert.filter(id=item_id).update(is_deleted=1)
        await record_audit(user["real_name"], "VOICE_DELETE", v.content, f"物理清除部门语音节点 [ID:{item_id}]")
    return {"status": "ok"}

@router.get("/sops")
async def get_sops(page: int = 1, size: int = 50, search: str = "", current_user: dict = Depends(check_permission("admin:sop:view"))):
    try:
        role_id = current_user.get("role_id")
        dept_id = current_user.get("dept_id")
        
        # 强制物理隔离与角色权限自适应
        if role_id == 3: # HQ 角色可以看到所有 SOP
            query = BusinessSOP.filter(is_deleted=0)
        else: # 其它角色仅能看到本部门 SOP
            query = BusinessSOP.filter(is_deleted=0, department_id=dept_id)
        
        if search:
            query = query.filter(title__icontains=search)
            
        total = await query.count()
        data = await query.offset((page - 1) * size).limit(size).order_by("-id").values(
            "id", "title", "content", "sop_type", "department_id"
        )
        
        # 补全部门名称逻辑，避免 select_related 在 values 中可能的异常
        for item in data:
            if item.get("department_id"):
                dept = await Department.get_or_none(id=item["department_id"])
                item["department__name"] = dept.name if dept else "未知部门"
            else:
                item["department__name"] = "全域规范"
                
        return {"status": "ok", "data": data, "total": total}
    except Exception as e:
        print(f"❌ [SOP] 数据调取失败: {e}")
        return {"status": "error", "message": str(e)}

@router.post("/sops")
async def save_sop(data: dict, user: dict = Depends(check_permission("admin:sop:create"))):
    item_id = data.get("id")
    dept_id = user.get("dept_id")
    
    if item_id and "admin:sop:update" not in user.get("permissions", []):
        raise HTTPException(status_code=403, detail="越权拦截：缺失 SOP 更新权限")

    payload = {
        "title": data.get("title"),
        "content": data.get("content"),
        "sop_type": data.get("sop_type", "TEXT"),
        "department_id": dept_id
    }

    async with in_transaction() as conn:
        if item_id:
            s_old = await BusinessSOP.get_or_none(id=item_id)
            if not s_old: return {"status": "error", "message": "SOP 节点不存在"}
            # 严格校验：禁止跨部门修改
            if s_old.department_id != dept_id:
                raise HTTPException(status_code=403, detail="越权拦截：严禁修改跨部门 SOP")
            await BusinessSOP.filter(id=item_id).update(**payload)
            await record_audit(user["real_name"], "SOP_UPDATE", data.get("title"), f"重校本部门 SOP 规范 [ID:{item_id}]")
        else:
            await BusinessSOP.create(**payload)
            await record_audit(user["real_name"], "SOP_CREATE", data.get("title"), "发布部门内部业务规范 (SOP)")
    return {"status": "ok"}

@router.post("/sops/delete")
async def delete_sop(data: dict, user: dict = Depends(check_permission("admin:sop:delete"))):
    item_id = data.get("id")
    dept_id = user.get("dept_id")
    
    async with in_transaction() as conn:
        s = await BusinessSOP.get_or_none(id=item_id)
        if not s: return {"status": "error", "message": "SOP 不存在"}
        
        # 严格校验：禁止跨部门删除
        if s.department_id != dept_id:
            raise HTTPException(status_code=403, detail="越权拦截：严禁移除跨部门 SOP")

        await BusinessSOP.filter(id=item_id).update(is_deleted=1)
        await record_audit(user["real_name"], "SOP_DELETE", s.title, f"销毁本部门 SOP 节点 [ID:{item_id}]")
    return {"status": "ok"}

@router.get("/sentiments")
async def get_sentiments(current_user: dict = Depends(get_current_user)):
    """[物理拉取] 获取动态客户情绪标签集 - 降级鉴权以确保实战稳定性"""
    try:
        print(f"📡 [SENTIMENT] 用户 {current_user.get('username')} 发起数据请求")
        data = await CustomerSentiment.filter(is_deleted=0).order_by("id").values()
        print(f"✅ [SENTIMENT] 成功返回 {len(data)} 条维度数据")
        return {"status": "ok", "data": data}
    except Exception as e:
        print(f"❌ [SENTIMENT] 数据库调取失败: {e}")
        return {"status": "error", "message": str(e)}

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
    try:
        role_id = current_user.get("role_id")
        dept_id = current_user.get("dept_id")
        
        query = KnowledgeBase.filter(is_deleted=0)
        
        if role_id != 3: # 非 HQ 角色仅能看到全局或本部门话术
            query = query.filter(Q(department_id__isnull=True) | Q(department_id=dept_id))
        
        if search:
            query = query.filter(Q(keyword__icontains=search) | Q(answer__icontains=search))
            
        total = await query.count()
        data = await query.offset((page - 1) * size).limit(size).order_by("-id").values(
            "id", "keyword", "answer", "is_active", "category_id", "department_id"
        )
        
        # 补充关联数据，确保 values() 稳定性
        for item in data:
            if item.get("category_id"):
                cat = await PolicyCategory.get_or_none(id=item["category_id"])
                item["category__name"] = cat.name if cat else "未分类"
            if item.get("department_id"):
                dept = await Department.get_or_none(id=item["department_id"])
                item["department__name"] = dept.name if dept else "未知部门"
            else:
                item["department__name"] = "全局共享"
                
        return {"status": "ok", "data": data, "total": total}
    except Exception as e:
        print(f"❌ [KB] 数据调取异常: {e}")
        return {"status": "error", "message": str(e)}

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