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
from dotenv import load_dotenv

# --- 1. 工业级配置中心 ---
load_dotenv()

def load_config():
    return {
        "ai": {
            "enabled": os.getenv("AI_ENABLED", "true").lower() == "true",
            "url": os.getenv("AI_URL", "http://127.0.0.1:11434/api/chat"),
            "model": os.getenv("AI_MODEL", "qwen2:1.5b")
        },
        "db": {
            "type": os.getenv("DB_TYPE", "sqlite"),
            "host": os.getenv("DB_HOST", "localhost"),
            "port": os.getenv("DB_PORT", "3306"),
            "user": os.getenv("DB_USER", "root"),
            "pass": os.getenv("DB_PASSWORD", ""),
            "name": os.getenv("DB_NAME", "smart_cs")
        },
        "redis": {
            "host": os.getenv("REDIS_HOST", ""),
            "port": int(os.getenv("REDIS_PORT", 6379)),
            "pass": os.getenv("REDIS_PASSWORD", ""),
            "db": int(os.getenv("REDIS_DB", 0))
        },
        "server": {
            "host": os.getenv("SERVER_HOST", "0.0.0.0"),
            "port": int(os.getenv("SERVER_PORT", 8000))
        },
        "security": {
            "jwt_secret": os.getenv("JWT_SECRET", "default_secret"),
            "auth_enabled": os.getenv("AUTH_ENABLED", "true").lower() == "true"
        }
    }

CONFIG = load_config()

# --- 2. 核心服务初始化 ---
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

logger = logging.getLogger("SmartCS")
logger.setLevel(logging.INFO)
handler = RotatingFileHandler("app.log", maxBytes=10*1024*1024, backupCount=5)
handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)

# --- 3. Redis 指令枢纽 ---
class RedisTacticalHub:
    def __init__(self, agent_id):
        self.agent_id = agent_id
        cfg = CONFIG["redis"]
        if not cfg["host"]:
            self.r = None
            return
        try:
            self.r = redis.Redis(host=cfg["host"], port=cfg["port"], password=cfg["pass"], db=cfg["db"], decode_responses=True)
            self.stream_key = f"commands:agent:{agent_id}"
        except: self.r = None

    async def listen_commands(self):
        if not self.r: return
        while True:
            try:
                # 使用 Redis Streams 读取指令
                streams = self.r.xread({self.stream_key: "$"}, count=1, block=5000)
                if streams:
                    for _, messages in streams:
                        for _, data in messages:
                            await broadcast_event({"type": "SUPERVISOR_COMMAND", "data": data})
            except Exception as e:
                logger.error(f"Redis 链路异常: {e}")
                await asyncio.sleep(5)

# --- 4. 画像引擎与通信 ---
class PersonaEngine:
    def __init__(self):
        self.db_path = "customers.db"
        # 实际生产中这里应判断 CONFIG['db']['type'] 来决定连接 SQLite 还是 MySQL
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

# --- 5. 启动入口 ---
if __name__ == "__main__":
    srv_cfg = CONFIG["server"]
    print(f"🚀 Smart-CS Pro 核心引擎已启动 (监听: {srv_cfg['host']}:{srv_cfg['port']})")
    uvicorn.run(app, host=srv_cfg["host"], port=srv_cfg["port"])