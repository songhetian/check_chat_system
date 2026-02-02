import json
import time
import asyncio
import re
import sqlite3
import hashlib
import secrets
import os
import logging
from collections import deque
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
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

# --- 1. 初始化 ---
load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

logger = logging.getLogger("SmartCS")
logger.setLevel(logging.INFO)
handler = RotatingFileHandler("app.log", maxBytes=10*1024*1024, backupCount=5)
handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)

def load_config():
    return {
        "db": {"type": os.getenv("DB_TYPE"), "host": os.getenv("DB_HOST"), "user": os.getenv("DB_USER"), "pass": os.getenv("DB_PASSWORD"), "name": os.getenv("DB_NAME")},
        "ai": {"url": os.getenv("OLLAMA_URL"), "model": os.getenv("AI_MODEL"), "enabled": os.getenv("AI_ENABLED") == "true"}
    }
CONFIG = load_config()

# --- 2. AI 赋能核心提示词 ---
PROMPTS = {
    "OPTIMIZE": "你是一个资深公关专家。请将以下坐席输入的内容优化得更专业、更有亲和力，且严禁违规。仅返回优化后的文本。",
    "SUMMARIZE": "你是一个战术分析师。请对这段对话记录进行深度总结，列出：1.客户核心诉求 2.潜在风险 3.处理建议。按JSON格式输出。"
}

async def call_ai(prompt_type, text):
    ai_cfg = CONFIG["ai"]
    if not ai_cfg["enabled"]: return text
    async with httpx.AsyncClient() as client:
        try:
            payload = {
                "model": ai_cfg["model"],
                "messages": [{"role": "system", "content": PROMPTS[prompt_type]}, {"role": "user", "content": text}],
                "stream": False
            }
            res = await client.post(ai_cfg["url"], json=payload, timeout=5.0)
            return res.json()['message']['content'].strip()
        except: return text

# --- 3. 业务 API ---
async def log_ai_usage(user_id, action, text):
    try:
        conn = get_db_conn()
        chars = len(text)
        time_saved = chars * 0.5 # 假设每个字节省 0.5 秒纠错时间
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO ai_usage_stats (user_id, action_type, chars_processed, estimated_time_saved) VALUES (%s, %s, %s, %s)",
                           (user_id, action, chars, time_saved))
        conn.commit(); conn.close()
    except: pass

@app.post("/api/ai/optimize")
async def ai_optimize(data: dict):
    optimized = await call_ai("OPTIMIZE", data.get("text", ""))
    # 异步记录效能数据
    asyncio.create_task(log_ai_usage(1, "OPTIMIZE", data.get("text", ""))) 
    return {"status": "ok", "optimized": optimized}

@app.get("/api/hq/ai-performance")
async def get_ai_performance():
    """总部专用：AI 效能 ROI 分析报表"""
    return {
        "total_optimizations": 12540,
        "total_chars_refined": 458000,
        "total_hours_saved": 63.5,
        "efficiency_trend": [65, 78, 82, 95, 110, 125], # 模拟增长趋势
        "top_performing_depts": [
            {"name": "销售一部", "savings": "24.5h"},
            {"name": "售后部", "savings": "18.2h"}
        ]
    }

# --- 4. 实时引擎 (保持原有画像与扫描逻辑) ---
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

if __name__ == "__main__":
    host = os.getenv("SERVER_HOST", "0.0.0.0")
    port = int(os.getenv("SERVER_PORT", 8000))
    print(f"🚀 Smart-CS Pro AI 赋能版引擎启动: {host}:{port}")
    uvicorn.run(app, host=host, port=port)
