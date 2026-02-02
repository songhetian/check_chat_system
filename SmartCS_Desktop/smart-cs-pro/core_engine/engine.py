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

# --- 工业级配置中心 ---
def load_config():
    try:
        with open("../server_config.json", "r") as f:
            return json.load(f)
    except:
        return {
            "ai_engine": {"url": "http://127.0.0.1:11434/api/chat", "enabled": True, "model": "qwen2:1.5b"},
            "network": {"local_port": 8000, "local_bind_host": "0.0.0.0"}
        }

CONFIG = load_config()

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

logger = logging.getLogger("SmartCS")
logger.setLevel(logging.INFO)
handler = RotatingFileHandler("app.log", maxBytes=10*1024*1024, backupCount=5)
logger.addHandler(handler)

# --- 1. Redis 战术枢纽 ---
class RedisTacticalHub:
    def __init__(self, agent_id):
        self.agent_id = agent_id
        try:
            self.r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
            self.stream_key = f"commands:agent:{agent_id}"
        except: self.r = None

    async def listen_commands(self):
        if not self.r: return
        while True:
            try:
                # 简化逻辑，仅示意
                streams = self.r.xread({self.stream_key: "$"}, count=1, block=5000)
                for _, messages in streams:
                    for _, data in messages:
                        await broadcast_event({"type": "SUPERVISOR_COMMAND", "data": data})
            except: await asyncio.sleep(5)

# --- 2. AI 超脑分析 ---
SYSTEM_PROMPT = """
你是一个顶级的数智战术指挥专家。请分析坐席与客户的对话，按 JSON 格式输出深度分析报告。
必须包含：risk_score(0-10), sentiment_score(0-100), persona(profession, personality, loyalty), strategy, suggestion。
"""

async def analyze_with_llm_ultra(text: str):
    ai_cfg = CONFIG.get("ai_engine", {})
    if not ai_cfg.get("enabled"): return
    async with httpx.AsyncClient() as client:
        try:
            payload = {
                "model": ai_cfg.get("model", "qwen2:1.5b"),
                "messages": [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": text}],
                "stream": False, "format": "json"
            }
            res = await client.post(ai_cfg.get("url"), json=payload, timeout=3.0)
            content = json.loads(res.json()['message']['content'])
            await broadcast_event({"type": "AI_ULTRA_ANALYSIS", "data": content, "context": text})
        except: pass

# --- 3. 画像与扫描 ---
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

# --- 启动逻辑 ---
if __name__ == "__main__":
    net_cfg = CONFIG.get("network", {})
    uvicorn.run(app, host=net_cfg.get("local_bind_host", "0.0.0.0"), port=net_cfg.get("local_port", 8000))
