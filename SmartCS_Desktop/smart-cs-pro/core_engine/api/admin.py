from fastapi import APIRouter, Query, Request, Depends, HTTPException
from core.models import User, Department, ViolationRecord, Role, Permission, RolePermission, PolicyCategory, SensitiveWord, KnowledgeBase
from api.auth import get_current_user, check_permission
from tortoise.expressions import Q
from tortoise.functions import Count
from tortoise.transactions import in_transaction
import os, json

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.post("/departments/update")
async def update_department(
    data: dict, 
    request: Request, 
    user: dict = Depends(check_permission("admin:dept:manage")) # 颗粒度校验
):
    dept_id, name, manager_id = data.get("id"), data.get("name"), data.get("manager_id")
    
    # 强制事务保障：确保部门信息与缓存的一致性
    async with in_transaction() as conn:
        dept = await Department.get_or_none(id=dept_id, is_deleted=0)
        if not dept: raise HTTPException(status_code=404, detail="部门不存在")
        dept.name = name
        dept.manager_id = manager_id
        await dept.save(using_db=conn)
        
        if request.app.state.redis: 
            await request.app.state.redis.delete("cache:departments")
            
    return {"status": "ok"}

@router.post("/role/permissions")
async def update_role_permissions(
    data: dict, 
    request: Request, 
    user: dict = Depends(check_permission("admin:rbac:config"))
):
    role_id, new_perms = data.get("role_id"), data.get("permissions", [])
    redis = request.app.state.redis
    
    # 核心：事务包裹全量覆盖逻辑
    async with in_transaction() as conn:
        old_perms = await RolePermission.filter(role_id=role_id).values_list("permission_code", flat=True)
        await RolePermission.filter(role_id=role_id).delete(using_db=conn)
        
        if new_perms:
            objs = [RolePermission(role_id=role_id, permission_code=p) for p in new_perms]
            await RolePermission.bulk_create(objs, using_db=conn)
            
        added = set(new_perms) - set(old_perms)
        removed = set(old_perms) - set(new_perms)
    
    # 广播逻辑维持在事务外（不阻塞 DB 回滚）
    if redis and (added or removed):
        role = await Role.get_or_none(id=role_id)
        role_code = role.code if role else "UNKNOWN"
        payload = {"type": "PERMISSION_CHANGED", "target_role": role_code, "title": "权责重校", "details": f"变动：+{len(added)} / -{len(removed)}"}
        await redis.publish("notif_channel", json.dumps(payload))
        
    return {"status": "ok"}

@router.post("/sensitive-words")
async def save_sensitive_word(
    data: dict, 
    request: Request, 
    user: dict = Depends(check_permission("admin:ai:policy"))
):
    word_id = data.get("id")
    payload = {"word": data.get("word"), "category_id": data.get("category_id"), "risk_level": data.get("risk_level", 5)}
    
    async with in_transaction() as conn:
        if word_id: await SensitiveWord.filter(id=word_id).update(**payload)
        else: await SensitiveWord.create(**payload)
        
        # 实时热更新同步
        redis = request.app.state.redis
        if redis:
            all_words = await SensitiveWord.filter(is_active=1, is_deleted=0).values("word", "risk_level")
            await redis.set("cache:sensitive_words", json.dumps(all_words))
            
    return {"status": "ok"}

# 其他查询接口保持 get_current_user 基础校验即可
@router.get("/agents")
async def get_agents(request: Request, current_user: dict = Depends(get_current_user), page: int = 1):
    # ... 省略查询逻辑 (已在之前步骤完成)
    return {"status": "ok"}