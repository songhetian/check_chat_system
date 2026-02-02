# --- 34. 员工成长进阶 (Growth Engine) ---

class GrowthManager:
    def __init__(self):
        self.milestone_target = 3 # 目标：连续3天

    async def check_promotion(self, username):
        """
        [工业级成长体系] 检查并触发坐席进阶
        """
        try:
            conn = get_db_conn()
            with conn.cursor() as cursor:
                # 查询当前连续天数
                cursor.execute("SELECT streak_days, real_name FROM users WHERE username = %s", (username,))
                user = cursor.fetchone()
                
                if user and user['streak_days'] >= self.milestone_target:
                    # 触发进阶事件
                    logger.info(f"🎖️ [勋章系统] 坐席 {username} 已达成新兵营毕业条件")
                    await manager.send_to_user(username, {
                        "type": "GROWTH_MILESTONE",
                        "title": "恭喜！新兵营毕业",
                        "message": f"尊敬的 {user['real_name']}，您已连续 {self.milestone_target} 天保持零违规记录！",
                        "voice_alert": "恭喜你完成新兵训练营，表现优异，系统建议您切换至专家模式。",
                        "recommend_action": "DISABLE_ONBOARDING"
                    })
                    # 更新等级
                    cursor.execute("UPDATE users SET rank_level = 'VETERAN' WHERE username = %s", (username,))
                conn.commit(); conn.close()
        except Exception as e:
            logger.error(f"成长引擎计算异常: {e}")

growth_manager = GrowthManager()
