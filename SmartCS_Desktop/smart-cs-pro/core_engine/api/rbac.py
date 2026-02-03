from fastapi import APIRouter
from core.models import User, Role
from tortoise.transactions import in_transaction

router = APIRouter(prefix="/api/hq", tags=["RBAC"])

@router.post("/user/update-role")
async def update_user_role(data: dict):
    """
    [总部专用] 动态调整用户角色 (基于 Role ID)
    """
    target_username = data.get("username")
    new_role_id = data.get("new_role_id")
    
    user = await User.get_or_none(username=target_username, is_deleted=0)
    if not user:
        return {"status": "error", "message": "目标用户不存在"}

    # 校验角色 ID 有效性
    role_exists = await Role.filter(id=new_role_id, is_deleted=0).exists()
    if not role_exists:
        return {"status": "error", "message": "无效的角色定义"}

    user.role_id = new_role_id
    await user.save()
    
    return {"status": "ok", "message": "角色权重已更新"}