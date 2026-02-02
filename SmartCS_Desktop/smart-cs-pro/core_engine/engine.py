import json
import time
import asyncio
import base64
import re
import sqlite3
import hashlib
import secrets
import os
import subprocess
import platform
import logging
from collections import deque
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pynput import keyboard
import uvicorn
import threading
from PIL import ImageGrab, Image, ImageDraw
import win32gui
import httpx
import pandas as pd
import io
import numpy as np

# --- 工业级配置与日志 ---
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

logger = logging.getLogger("SmartCS")
logger.setLevel(logging.INFO)
handler = RotatingFileHandler("app.log", maxBytes=10*1024*1024, backupCount=5)
handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)

# --- 战术画像引擎 (SQLite 闭环) ---
class PersonaEngine:
    def __init__(self):
        self.db_path = "customers.db"
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS customers (
                    name TEXT PRIMARY KEY,
                    level TEXT,
                    tags TEXT,
                    ltv REAL,
                    frequency INTEGER,
                    is_risk BOOLEAN,
                    last_seen REAL
                )
            """)

    def get_or_create_persona(self, raw_name):
        # 语义清洗：去掉微信括号等杂质
        clean_name = re.sub(r'\(.*?\)|\[.*?\]|\（.*?\）', '', raw_name).strip()
        if len(clean_name) < 2: return None

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM customers WHERE name=?", (clean_name,))
            row = cursor.fetchone()
            if row:
                conn.execute("UPDATE customers SET frequency = frequency + 1, last_seen = ? WHERE name = ?", (time.time(), clean_name))
                return { "name": row[0], "level": row[1], "tags": row[2].split(','), "ltv": row[3], "frequency": row[4] + 1, "isRisk": bool(row[5]) }
            else:
                conn.execute("INSERT INTO customers VALUES (?, 'NEW', '首次咨询', 0, 1, 0, ?)", (clean_name, time.time()))
                logger.info(f"🆕 自动为新客户建档: {clean_name}")
                return { "name": clean_name, "level": "NEW", "tags": ["首次咨询"], "ltv": 0, "frequency": 1, "isRisk": False }

persona_engine = PersonaEngine()

# --- 核心扫描器 ---
class SmartScanner:
    def __init__(self):
        self.ocr = None
        self.last_customer = ""
        self.regions = {"name_area": (450, 50, 800, 100), "chat_area": (400, 150, 900, 700)}

    def _ensure_ocr(self):
        if self.ocr is None:
            from paddleocr import PaddleOCR
            self.ocr = PaddleOCR(use_angle_cls=True, lang="ch", show_log=False)

    def scan_screen(self):
        self._ensure_ocr()
        try:
            full_img = ImageGrab.grab()
            # 识别姓名
            name_crop = full_img.crop(self.regions["name_area"])
            res = self.ocr.ocr(np.array(name_crop), cls=True)
            if res and res[0]:
                raw_name = res[0][0][1][0]
                data = persona_engine.get_or_create_persona(raw_name)
                if data and data["name"] != self.last_customer:
                    self.last_customer = data["name"]
                    asyncio.run_coroutine_threadsafe(broadcast_event({"type": "trigger-customer", "detail": data}), main_loop)
        except Exception as e:
            logger.error(f"扫描异常: {e}")

scanner = SmartScanner()

# --- 通信总线 (含 Redis 预留) ---
async def broadcast_event(data):
    # 这里可以扩展推送给 Redis: redis_client.publish('tactical_events', json.dumps(data))
    for conn in engine.active_connections:
        try: await conn.send_text(json.dumps(data))
        except: pass

class RiskEngine:
    def __init__(self):
        self.sensitive_words = ["转账", "投诉", "报警"]
        self.char_buffer = deque(maxlen=50)
        self.active_connections = []
    def add_char(self, char):
        self.char_buffer.append(char)
        return self.check_text()
    def check_text(self):
        text = "".join(self.char_buffer)
        for w in self.sensitive_words:
            if w in text: return {"type": "VIOLATION", "keyword": w, "context": text}
        return None

engine = RiskEngine()

# --- WebSocket & API ---
@app.websocket("/ws/risk")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    engine.active_connections.append(websocket)
    try:
        while True:
            msg = await websocket.receive_text()
            data = json.loads(msg)
            if data.get("type") == "MUTE_AGENT":
                await websocket.send_text(json.dumps({"type": "MUTE_CONFIRM"}))
    except: engine.active_connections.remove(websocket)

@app.get("/api/admin/stats")
async def get_stats():
    return { "total_risk_today": 42, "active_agents": len(engine.active_connections) }

# --- 循环任务 ---
def auto_scan_loop():
    while True:
        try:
            hwnd = win32gui.GetForegroundWindow()
            title = win32gui.GetWindowText(hwnd)
            if any(t in title for t in ["微信", "钉钉", "WeChat"]):
                scanner.scan_screen()
                time.sleep(3)
            else: time.sleep(10)
        except: time.sleep(5)

def keyboard_hook():
    def on_press(key):
        if hasattr(key, 'char'):
            res = engine.add_char(key.char)
            if res: asyncio.run_coroutine_threadsafe(broadcast_event(res), main_loop)
    with keyboard.Listener(on_press=on_press) as l: l.join()

if __name__ == "__main__":
    main_loop = asyncio.new_event_loop()
    threading.Thread(target=keyboard_hook, daemon=True).start()
    threading.Thread(target=auto_scan_loop, daemon=True).start()
    uvicorn.run(app, host="0.0.0.0", port=8000)
