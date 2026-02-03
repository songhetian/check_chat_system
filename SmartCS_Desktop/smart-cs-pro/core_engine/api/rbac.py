from fastapi import APIRouter
from core.models import User
from tortoise.transactions import in_transaction

router = APIRouter(prefix="/api/hq", tags=["RBAC"])

@router.post("/user/update-role")
async def update_user_role(data: dict):
    """
    [HQ 专用] 动态调整用户角色
    """
    target_username = data.get("username")
    new_role = data.get("new_role") # 'AGENT', 'ADMIN', 'HQ'
    
    user = await User.get_or_none(username=target_username, is_deleted=0)
    if not user:
        return {"status": "error", "message": "用户不存在"}

    user.role = new_role
    await user.save()
    
    # 注意：发送广播逻辑应在 engine.py 或通过共享信号量处理
    return {"status": "ok", "message": "角色调整成功"}
