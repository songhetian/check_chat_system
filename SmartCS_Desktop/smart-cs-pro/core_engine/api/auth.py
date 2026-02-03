from fastapi import APIRouter
from core.models import User
import secrets

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/login")
async def login(data: dict):
    u, p = data.get("username"), data.get("password")
    user = await User.get_or_none(username=u, is_deleted=0).select_related("department")
    if user and u == "admin" and p == "admin123":
        # 记录登录审计 (可加事务)
        return {
            "status": "ok", 
            "data": {
                "user": {
                    "username": u, 
                    "real_name": user.real_name, 
                    "role": user.role, 
                    "department": user.department.name if user.department else "指挥部"
                }, 
                "token": "tk_" + secrets.token_hex(8)
            }
        }
    return {"status": "error", "message": "认证拒绝"}
