import pymysql
import os
import logging

def get_db_conn():
    return pymysql.connect(
        host=os.getenv("DB_HOST"), 
        user=os.getenv("DB_USER"), 
        password=os.getenv("DB_PASSWORD"), 
        database=os.getenv("DB_NAME"), 
        cursorclass=pymysql.cursors.DictCursor
    )

async def shadow_coach_logic(customer_msg, agent_id, manager_ref):
    """
    [工业级] 动态知识库检索：监测客户问题并匹配 MySQL 中的教官建议
    """
    try:
        conn = get_db_conn()
        with conn.cursor() as cursor:
            # 核心：使用 SQL LIKE 模糊匹配客户消息中的关键词
            sql = "SELECT answer, category FROM knowledge_base WHERE %s LIKE CONCAT('%', keyword, '%') AND is_active=1 LIMIT 1"
            cursor.execute(sql, (customer_msg,))
            match = cursor.fetchone()
            
            if match:
                payload = {
                    "type": "COACH_ADVICE",
                    "title": f"带教指引：{match['category']}",
                    "content": match['answer'],
                    "voice_alert": "检测到相关业务咨询，已调取标准战术话术。"
                }
                # 发送精准指令
                await manager_ref.send_to_user(agent_id, payload)
        conn.close()
    except Exception as e:
        logging.error(f"知识库检索异常: {e}")