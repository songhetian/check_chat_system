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

async def grant_user_reward(user_id: int, type: str, title: str, value: int, ws_manager=None):
    """
    [实战奖励] 为操作员注入战术奖励 (积分/勋章) 并实时推送信号
    """
    from core.models import UserReward
    async with in_transaction() as conn:
        user = await User.select_for_update().get(id=user_id)
        # 如果是积分奖励
        if type == 'SCORE':
            user.tactical_score = min(100, user.tactical_score + value)
            await user.save(using_db=conn)
        
        await UserReward.create(
            user=user, type=type, title=title, value=value, using_db=conn
        )

        if ws_manager:
            import time
            await ws_manager.broadcast({
                "type": "REWARD",
                "username": user.username,
                "reward_type": type,
                "title": title,
                "value": value,
                "timestamp": time.time() * 1000
            })
    return True

async def start_recruit_training(user_id: int):
    """
    [培训模式] 激活新兵 SOP 引导链路
    """
    from core.models import TrainingSession
    session, _ = await TrainingSession.get_or_create(user_id=user_id, defaults={"mode": "SOP_GUIDE"})
    return session

class SmartScanner:
    def __init__(self):
        self.ocr = None
        self.last_hash = ""

    async def process(self, text, username="admin", redis_client=None, ws_manager=None):
        if not text: return False
        
        # 1. 物理定位操作员
        user = await User.get_or_none(username=username).select_related("department")
        if not user: return False

        # 2. 扫描高危全域敏感词
        words = await SensitiveWord.filter(is_active=1).values("word", "risk_level")
        for w in words:
            if w["word"] in text:
                await execute_violation_workflow(username, w["word"], text, w["risk_level"], redis_client=redis_client)
                if ws_manager:
                    await ws_manager.broadcast({
                        "type": "VIOLATION",
                        "username": username,
                        "keyword": w["word"],
                        "risk_level": w["risk_level"],
                        "context": text,
                        "id": secrets.token_hex(12)
                    })
                return True 

        # 3. 扫描部门规避词 (V3.33 静默拦截)
        from tortoise.expressions import Q
        dept_words = await DeptSensitiveWord.filter(
            Q(department_id__isnull=True) | Q(department_id=user.department_id),
            is_active=1, is_deleted=0
        ).values("word", "suggestion")

        for dw in dept_words:
            if dw["word"] in text:
                # 记录合规审计
                await DeptComplianceLog.create(
                    id=secrets.token_hex(12),
                    user=user,
                    word=dw["word"],
                    context=text,
                    department_id=user.department_id
                )
                if ws_manager:
                    await ws_manager.broadcast({
                        "type": "TACTICAL_DEPT_VIOLATION",
                        "username": username,
                        "keyword": dw["word"],
                        "suggestion": dw.get("suggestion") or "请注意用语规范"
                    })
                return True
        return False 
