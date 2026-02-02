import json, time, asyncio, re, sqlite3, hashlib, secrets, os, logging
from datetime import datetime
from collections import deque
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn, threading, httpx, numpy as np, pymysql
from PIL import ImageGrab
from dotenv import load_dotenv

# --- 1. 初始化 ---
load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"])

def get_db_conn():
    return pymysql.connect(host=os.getenv("DB_HOST"), user=os.getenv("DB_USER"), password=os.getenv("DB_PASSWORD"), database=os.getenv("DB_NAME"), cursorclass=pymysql.cursors.DictCursor)

# --- 2. 战术效能引擎 (加权算法) ---
class TacticalPerformanceManager:
    def __init__(self):
        # 结构: {agent_id: {date_str: set(customer_names)}}
        self.daily_history = {}

    async def update_score(self, username, customer_name, event_type="RECEPTION"):
        """
        [工业级核心算法]
        1. RECEPTION: +10分 (每天每位客户仅限1次)
        2. VIOLATION: -100分 (严厉惩罚)
        3. AI_ADOPT: +20分 (鼓励学习)
        """
        today = datetime.now().strftime('%Y-%m-%d')
        agent_data = self.daily_history.setdefault(username, {}).setdefault(today, set())
        
        score_delta = 0
        if event_type == "RECEPTION":
            if customer_name not in agent_data:
                agent_data.add(customer_name)
                score_delta = 10
        elif event_type == "VIOLATION":
            score_delta = -100
        elif event_type == "AI_ADOPT":
            score_delta = 20

        if score_delta != 0:
            try:
                conn = get_db_conn()
                with conn.cursor() as cursor:
                    # 更新总分与接待量
                    cursor.execute("""
                        UPDATE users SET 
                        tactical_score = tactical_score + %s,
                        handled_customers_count = handled_customers_count + %s
                        WHERE username = %s
                    """, (score_delta, 1 if event_type == "RECEPTION" and score_delta > 0 else 0, username))
                conn.commit(); conn.close()
                return True
            except: pass
        return False

perf_manager = TacticalPerformanceManager()

# --- 3. 全局协同：广播效能更新 ---
async def broadcast_event(data):
    # 如果是违规，自动扣分
    if data["type"] == "VIOLATION":
        await perf_manager.update_score("admin", None, "VIOLATION")
    
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
            # 识别到姓名：触发每天一次逻辑
            if data["type"] == "CUSTOMER_DETECTED":
                if await perf_manager.update_score(username, data["name"], "RECEPTION"):
                    await broadcast_event({"type": "SCORE_UPDATED", "username": username})
    except: active_connections.remove(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
