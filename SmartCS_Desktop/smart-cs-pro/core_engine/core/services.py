import json, secrets, logging
from tortoise.transactions import in_transaction
from core.models import User, ViolationRecord, Notification

logger = logging.getLogger("SmartCS")

async def execute_violation_workflow(username: str, keyword: str, context: str, risk_score: int, redis_client=None):
    """
    [工业级事务] 违规处理闭环：记录取证记录 + 扣除战术分 + 生成系统通知
    """
    try:
        async with in_transaction() as conn:
            # 1. 锁定并获取用户信息 (防止并发更新分数冲突)
            user = await User.select_for_update().get(username=username)
            
            # 2. 插入违规取证记录
            await ViolationRecord.create(
                id=secrets.token_hex(12),
                user=user,
                keyword=keyword,
                context=context,
                risk_score=risk_score,
                using_db=conn
            )
            
            # 3. 更新战术评分 (逻辑：分数越低越危险)
            user.tactical_score = max(0, user.tactical_score - risk_score)
            await user.save(using_db=conn)
            
            # 4. 生成系统通知
            await Notification.create(
                id=secrets.token_hex(12),
                title="战术拦截：触发高危行为",
                content=f"坐席 {user.real_name} 命中关键词 [{keyword}]，系统已自动扣除 {risk_score} 战术分并完成取证。",
                type="ALERT",
                using_db=conn
            )
            
            # 5. Redis 同步信号
            if redis_client:
                await redis_client.publish("notif_channel", json.dumps({"type": "ALERT", "target": username}))
            
            logger.info(f"🛡️ [事务成功] 违规闭环已完成: {username}")
            return True
    except Exception as e:
        logger.error(f"❌ [事务失败] 违规处理回滚: {e}")
        return False

class SmartScanner:
    def __init__(self):
        self.ocr = None
        self.last_hash = ""

    async def process(self, text, username="admin", redis_client=None): # 演示用 admin
        # 发现财务违规
        if any(k in text for k in ["钱", "转账", "加微信"]):
            # 调用事务函数
            await execute_violation_workflow(username, "高危交易/引导", text, 10, redis_client=redis_client)
            # await broadcast_event({"type": "VIOLATION", "keyword": "高危交易", "context": text})
