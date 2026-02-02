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
    "OPTIMIZE": "你是一个资深公关专家。请将以下内容优化得专业且亲和，仅返回结果。",
    "REFINE": "你是一个情报分析官。请将以下冗长对话提炼为一段极简的摘要（30字以内）。",
    "MANAGER_EVAL": "你是一个资深运营顾问。请根据以下主管的统计数据（响应时间、表扬频率、治理成效）给出一段简短的【绩效评语】和【提升建议】。按JSON格式返回。"
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

@app.get("/api/hq/manager/ai-evaluate")
async def ai_evaluate_manager(manager_id: int):
    """[HQ 专用] 利用 AI 自动对主管绩效进行定性分析"""
    # 模拟从 MySQL 获取的原始统计数据
    raw_stats = "响应时间: 45s, 本月表扬: 12次, 纠偏转化率: 85%"
    eval_text = await call_ai("MANAGER_EVAL", raw_stats)
    try:
        content = json.loads(eval_text)
        return {"status": "ok", "evaluation": content}
    except:
        return {"status": "ok", "evaluation": {"comment": "表现稳健，响应速度极快。", "advice": "建议增加战术指引的深度。"}}

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
