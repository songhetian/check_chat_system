from fastapi import APIRouter
from core.models import User, Role, AuditLog
from tortoise.transactions import in_transaction

router = APIRouter(prefix="/api/hq", tags=["RBAC"])

async def record_audit(operator: str, action: str, target: str, details: str):
    await AuditLog.create(operator=operator, action=action, target=target, details=details)

@router.post("/user/update-role")
async def update_user_role(data: dict):
    # ... 原有校验逻辑
    target_username = data.get("username")
    new_role_id = data.get("new_role_id")
    
    user = await User.get_or_none(username=target_username, is_deleted=0)
    if not user: return {"status": "error", "message": "目标用户不存在"}

    role = await Role.get_or_none(id=new_role_id, is_deleted=0)
    if not role: return {"status": "error", "message": "无效的角色定义"}

    old_role_id = user.role_id
    user.role_id = new_role_id
    async with in_transaction() as conn:
        await user.save(using_db=conn)
        # 强制审计：记录角色变更
        await record_audit("SYSTEM_HQ", "ROLE_CHANGE", target_username, f"权重重校: ID {old_role_id} -> {new_role_id} ({role.name})")
    
    return {"status": "ok", "message": "角色权重已更新"}