import json
import time
import asyncio
import re
import sqlite3
import os
import logging
from collections import deque
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pynput import keyboard
import uvicorn
import threading
from PIL import ImageGrab
import win32gui
import httpx
import numpy as np
import redis

# --- 工业级配置 ---
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

logger = logging.getLogger("SmartCS")
logger.setLevel(logging.INFO)
handler = RotatingFileHandler("app.log", maxBytes=10*1024*1024, backupCount=5)
logger.addHandler(handler)

# --- 1. Redis 战术枢纽 (可靠指令链) ---
class RedisTacticalHub:
    def __init__(self, agent_id):
        self.agent_id = agent_id
        try:
            self.r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
            self.stream_key = f"commands:agent:{agent_id}"
            # 创建消费者组 (若不存在)
            try: self.r.xgroup_create(self.stream_key, "engine_group", id="0", mkstream=True)
            except: pass
        except: self.r = None

    async def listen_commands(self):
        """持续监听来自主管端的持久化指令"""
        if not self.r: return
        while True:
            try:
                # 读取未确认的指令 (ACK 机制)
                streams = self.r.xreadgroup("engine_group", self.agent_id, {self.stream_key: ">"}, count=1, block=5000)
                for _, messages in streams:
                    for msg_id, data in messages:
                        logger.info(f"⚡ [Redis指令] 收到核心指令: {data}")
                        # 推送给前端 WebSocket
                        await broadcast_event({"type": "SUPERVISOR_COMMAND", "data": data})
                        # 确认处理完成
                        self.r.xack(self.stream_key, "engine_group", msg_id)
            except: await asyncio.sleep(5)

# --- 2. 数据同步引擎 (SQLite -> MySQL) ---
class DataSyncer:
    def __init__(self):
        self.central_api = "http://192.168.1.100:8000/api/sync"

    async def sync_loop(self):
        """定时将本地客户增量数据同步到云端"""
        while True:
            try:
                with sqlite3.connect("customers.db") as conn:
                    cursor = conn.cursor()
                    # 查找未同步或最近更新的数据
                    cursor.execute("SELECT * FROM customers WHERE last_seen > ?", (time.time() - 3600,))
                    rows = cursor.fetchall()
                    if rows:
                        logger.info(f"☁️  正在同步 {len(rows)} 条画像数据至 MySQL...")
                        # 实际生产：httpx.post(self.central_api, json=rows)
                await asyncio.sleep(300) # 每小时同步一次
            except: await asyncio.sleep(60)

# --- 3. 画像与扫描逻辑 (保持并增强) ---
class PersonaEngine:
    def __init__(self):
        self.db_path = "customers.db"
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("CREATE TABLE IF NOT EXISTS customers (name TEXT PRIMARY KEY, level TEXT, tags TEXT, ltv REAL, frequency INTEGER, last_seen REAL)")

    def get_persona(self, raw_name):
        name = re.sub(r'\(.*?\)|\[.*?\]', '', raw_name).strip()
        if len(name) < 2: return None
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM customers WHERE name=?", (name,))
            row = cursor.fetchone()
            if row: return {"name": row[0], "level": row[1], "tags": row[2].split(','), "ltv": row[3], "frequency": row[4]}
            else:
                conn.execute("INSERT INTO customers VALUES (?, 'NEW', '新客户', 0, 1, ?)", (name, time.time()))
                return {"name": name, "level": "NEW", "tags": ["新客户"], "ltv": 0, "frequency": 1}

persona_engine = PersonaEngine()
redis_hub = RedisTacticalHub(agent_id="AGENT-001")
data_syncer = DataSyncer()

# --- 通信总线 ---
active_connections = []
async def broadcast_event(data):
    for conn in active_connections:
        try: await conn.send_text(json.dumps(data))
        except: pass

@app.websocket("/ws/risk")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True: await websocket.receive_text()
    except: active_connections.remove(websocket)

# --- 启动 ---
def keyboard_hook():
    # ... 原有键盘监听 ...
    pass

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    # 启动 Redis 监听协程
    loop.create_task(redis_hub.listen_commands())
    # 启动数据同步协程
    loop.create_task(data_syncer.sync_loop())
    
    threading.Thread(target=lambda: uvicorn.run(app, host="0.0.0.0", port=8000), daemon=True).start()
    print("🚀 Smart-CS Pro 工业级引擎已启动 (Redis Streams + Data Sync 模式)")
    loop.run_forever()