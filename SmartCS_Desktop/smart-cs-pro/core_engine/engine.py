import json, time, asyncio, re, sqlite3, hashlib, secrets, os, logging
from collections import deque
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn, threading, httpx, numpy as np, pymysql
from PIL import ImageGrab
from dotenv import load_dotenv

# --- 1. 配置 ---
load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"])

def get_db_conn():
    return pymysql.connect(host=os.getenv("DB_HOST"), user=os.getenv("DB_USER"), password=os.getenv("DB_PASSWORD"), database=os.getenv("DB_NAME"), cursorclass=pymysql.cursors.DictCursor)

# --- 2. 战术接待防刷引擎 ---
class CombatExpManager:
    def __init__(self):
        # {agent_id: {customer_name: last_time}}
        self.reception_cache = {}

    async def increment_volume_safe(self, username, customer_name):
        """
        [防刷逻辑] 30 分钟内同一个客户只计一次接待
        """
        now = time.time()
        agent_cache = self.reception_cache.setdefault(username, {})
        last_time = agent_cache.get(customer_name, 0)
        
        if now - last_time > 1800: # 30分钟冷却
            agent_cache[customer_name] = now
            try:
                conn = get_db_conn()
                with conn.cursor() as cursor:
                    cursor.execute("UPDATE users SET handled_customers_count = handled_customers_count + 1 WHERE username = %s", (username,))
                conn.commit(); conn.close()
                logging.info(f"🏅 [积分成功] 坐席 {username} 有效接待了 {customer_name}")
                return True
            except: pass
        return False

combat_manager = CombatExpManager()

# --- 3. 动态等级检查器 ---
class RankEngine:
    async def check_promotion(self, username, manager_ref):
        try:
            conn = get_db_conn()
            with conn.cursor() as cursor:
                # 1. 获取用户实时数据
                cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
                u = cursor.fetchone()
                # 2. 获取下一级配置
                cursor.execute("SELECT * FROM rank_config WHERE min_days > %s OR min_volume > %s ORDER BY min_volume ASC LIMIT 1", (u['streak_days'], u['handled_customers_count']))
                next_rank = cursor.fetchone()
                
                if next_rank:
                    # 检查是否达标
                    if u['streak_days'] >= next_rank['min_days'] and u['handled_customers_count'] >= next_rank['min_volume']:
                        # 触发授勋
                        await manager_ref.send_to_user(username, {
                            "type": "GROWTH_MILESTONE",
                            "title": f"晋升: {next_rank['display_name']}",
                            "rank": next_rank['rank_name'],
                            "voice_alert": f"恭喜达成战术里程碑，您已晋升为{next_rank['display_name']}"
                        })
                        cursor.execute("UPDATE users SET rank_level = %s, graduated_at = NOW() WHERE username = %s", (next_rank['rank_name'], username))
            conn.commit(); conn.close()
        except: pass

rank_engine = RankEngine()

# --- 4. 实时总线 ---
active_connections = []
async def broadcast_event(data):
    for conn in active_connections:
        try: await conn.send_text(json.dumps(data))
        except: pass

@app.websocket("/ws/risk")
async def websocket_endpoint(websocket: WebSocket, username: str = "admin"):
    await websocket.accept(); active_connections.append(websocket)
    try:
        while True:
            msg = await websocket.receive_text()
            data = json.loads(msg)
            # 识别到姓名时触发
            if data["type"] == "CUSTOMER_DETECTED":
                if await combat_manager.increment_volume_safe(username, data["name"]):
                    await rank_engine.check_promotion(username, None) # 演示简化
    except: active_connections.remove(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)