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

# --- 工业级配置与日志 ---
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

logger = logging.getLogger("SmartCS")
logger.setLevel(logging.INFO)
handler = RotatingFileHandler("app.log", maxBytes=10*1024*1024, backupCount=5)
handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)

def load_config():
    try:
        with open("../server_config.json", "r") as f:
            return json.load(f)
    except:
        return {"ollama_url": "http://localhost:11434/api/chat", "ai_enabled": True}

CONFIG = load_config()

# --- 核心引擎类 ---
class RiskEngine:
    def __init__(self):
        self.sensitive_words = ["转账", "加微信", "投诉", "报警"]
        self.char_buffer = deque(maxlen=50)
        self.active_connections = []

    def add_char(self, char):
        self.char_buffer.append(char)
        return self.check_text()

    def check_text(self):
        raw_text = "".join(self.char_buffer)
        for word in self.sensitive_words:
            if word in raw_text:
                return {"type": "VIOLATION", "keyword": word, "context": raw_text}
        return None

engine = RiskEngine()

# --- AI 超脑分析 ---
SYSTEM_PROMPT = """
你是一个顶级的数智战术指挥专家。请分析坐席与客户的对话，按 JSON 格式输出深度分析报告。
必须包含：
1. risk_score: 0-10 风险分。
2. sentiment_score: 0-100 客户情绪分 (0极怒, 100极信任)。
3. persona: { "profession": "职业倾向", "personality": "性格标签", "loyalty": "忠诚度建议" }。
4. strategy: "建议采用的战术策略"。
5. suggestion: "具体的一键采用话术"。
"""

async def analyze_with_llm_ultra(text: str):
    if not CONFIG.get("ai_enabled"): return
    async with httpx.AsyncClient() as client:
        try:
            payload = {
                "model": "qwen2:1.5b",
                "messages": [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": text}],
                "stream": False, "format": "json"
            }
            res = await client.post(CONFIG["ollama_url"], json=payload, timeout=3.0)
            content = json.loads(res.json()['message']['content'])
            await broadcast_event({"type": "AI_ULTRA_ANALYSIS", "data": content, "context": text})
        except: pass

# --- 视频取证与缓冲 ---
class ForensicRecorder:
    def __init__(self):
        self.frame_buffer = deque(maxlen=50) # 5秒缓冲
    def capture_frame(self):
        try:
            img = ImageGrab.grab()
            img = img.resize((800, 450))
            self.frame_buffer.append(np.array(img))
        except: pass
    async def save_evidence(self, vid):
        # 模拟保存
        logger.info(f"📹 视频取证已生成: {vid}")

forensic_recorder = ForensicRecorder()

# --- 通信逻辑 ---
async def broadcast_event(data):
    # 模拟数据丰富
    if data["type"] == "VIOLATION":
        data["timestamp"] = time.time() * 1000
        data["id"] = str(int(time.time() * 1000))
        asyncio.create_task(forensic_recorder.save_evidence(data["id"]))
    
    for conn in engine.active_connections:
        try: await conn.send_text(json.dumps(data))
        except: pass

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
    except:
        engine.active_connections.remove(websocket)

# --- 业务 API ---
@app.get("/api/admin/stats")
async def get_stats():
    return {
        "total_risk_today": 42,
        "ai_correction_rate": "92%",
        "active_agents": len(engine.active_connections),
        "avg_response_time": "0.8s",
        "risk_distribution": [{"name": "语义风险", "value": 45}, {"name": "合规避让", "value": 30}, {"name": "态度问题", "value": 25}]
    }

class PlatformManager:
    def __init__(self):
        self.db_path = "platforms.db"
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS platforms (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE,
                    window_keyword TEXT,
                    is_active BOOLEAN
                )
            """)
            # 初始化默认目标
            conn.execute("INSERT OR IGNORE INTO platforms (name, window_keyword, is_active) VALUES ('WeChat', '微信', 1)")
            conn.execute("INSERT OR IGNORE INTO platforms (name, window_keyword, is_active) VALUES ('DingTalk', '钉钉', 1)")

    def get_active_keywords(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT window_keyword FROM platforms WHERE is_active=1")
            return [r[0] for r in cursor.fetchall()]

platform_manager = PlatformManager()

# --- 监控目标管理 API ---
@app.get("/api/admin/platforms")
async def get_platforms():
    with sqlite3.connect("platforms.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM platforms")
        return [{"id": r[0], "name": r[1], "keyword": r[2], "active": r[3]} for r in rows]

@app.post("/api/admin/platforms/add")
async def add_platform(name: str, keyword: str):
    with sqlite3.connect("platforms.db") as conn:
        conn.execute("INSERT INTO platforms (name, window_keyword, is_active) VALUES (?, ?, 1)", (name, keyword))
    return {"status": "ok"}

# 修改扫描逻辑，使用数据库配置
def auto_scan_loop():
    logger.info("👀 工业级窗口感知扫描引擎已启动")
    while True:
        try:
            hwnd = win32gui.GetForegroundWindow()
            title = win32gui.GetWindowText(hwnd)
            
            # 动态获取战术目标
            targets = platform_manager.get_active_keywords()
            is_target = any(t.lower() in title.lower() for t in targets)
            
            if is_target:
                scanner.scan_screen()
                time.sleep(3)
            else:
                time.sleep(10) 
        except: time.sleep(5)

if __name__ == "__main__":
    main_loop = asyncio.new_event_loop()
    threading.Thread(target=keyboard_hook, daemon=True).start()
    threading.Thread(target=main_loops, daemon=True).start()
    # 核心：允许局域网访问
    uvicorn.run(app, host="0.0.0.0", port=8000)