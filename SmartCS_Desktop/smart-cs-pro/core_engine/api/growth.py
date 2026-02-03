from fastapi import APIRouter
from core.models import User
from tortoise.transactions import in_transaction
from datetime import datetime

router = APIRouter(prefix="/api/growth", tags=["Growth"])

DAY_TARGET = 3
VOLUME_TARGET = 50

@router.post("/check-promotion")
async def check_promotion(username: str):
    """
    [ORM 版] 只有当‘天数’和‘实战量’双达标时才允许毕业
    """
    user = await User.get_or_none(username=username, is_deleted=0)
    if not user:
        return {"status": "error", "message": "用户不存在"}

    has_days = user.streak_days >= DAY_TARGET
    has_volume = user.handled_customers_count >= VOLUME_TARGET
    
    if has_days and has_volume:
        async with in_transaction() as conn:
            user.rank_level = "ELITE"
            user.graduated_at = datetime.now()
            await user.save(using_db=conn)
            
            return {
                "status": "ok",
                "milestone": {
                    "type": "GROWTH_MILESTONE",
                    "message": f"恭喜毕业！您已达成 {user.handled_customers_count} 次实战接待且零违规！",
                    "rank": "ELITE OPERATOR"
                }
            }
    
    return {"status": "ok", "message": "尚未达成毕业标准", "current": {"days": user.streak_days, "volume": user.handled_customers_count}}
