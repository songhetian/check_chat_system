import os, logging, pymysql

def get_db_conn():
    return pymysql.connect(host=os.getenv("DB_HOST"), user=os.getenv("DB_USER"), password=os.getenv("DB_PASSWORD"), database=os.getenv("DB_NAME"), cursorclass=pymysql.cursors.DictCursor)

class GrowthManager:
    def __init__(self):
        self.day_target = 3        # 至少连续3天零违规
        self.volume_target = 50    # 至少接待50个客户 (实战硬指标)

    async def check_promotion_advanced(self, username, manager_ref):
        """
        [工业级进阶算法] 只有当‘天数’和‘实战量’双达标时才允许毕业
        """
        try:
            conn = get_db_conn()
            with conn.cursor() as cursor:
                cursor.execute("SELECT streak_days, handled_customers_count, real_name FROM users WHERE username = %s", (username,))
                user = cursor.fetchone()
                
                if user:
                    has_days = user['streak_days'] >= self.day_target
                    has_volume = user['handled_customers_count'] >= self.volume_target
                    
                    if has_days and has_volume:
                        # 触发终极毕业
                        await manager_ref.send_to_user(username, {
                            "type": "GROWTH_MILESTONE",
                            "message": f"恭喜毕业！您已达成 {user['handled_customers_count']} 次实战接待且零违规！",
                            "rank": "ELITE OPERATOR"
                        })
                        cursor.execute("UPDATE users SET rank_level = 'ELITE', graduated_at = NOW() WHERE username = %s", (username,))
            conn.commit(); conn.close()
        except Exception as e:
            logging.error(f"进阶引擎计算异常: {e}")

growth_manager = GrowthManager()