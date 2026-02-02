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
import pymysql
from dotenv import load_dotenv

# --- 1. 工业级初始化 ---
load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

logger = logging.getLogger("SmartCS")
logger.setLevel(logging.INFO)
handler = RotatingFileHandler("app.log", maxBytes=10*1024*1024, backupCount=5)
logger.addHandler(handler)

def load_config():
    return {
        "db": {"type": os.getenv("DB_TYPE"), "host": os.getenv("DB_HOST"), "user": os.getenv("DB_USER"), "pass": os.getenv("DB_PASSWORD"), "name": os.getenv("DB_NAME")},
        "ai": {"url": os.getenv("AI_URL"), "model": os.getenv("AI_MODEL"), "enabled": os.getenv("AI_ENABLED") == "true"}
    }
CONFIG = load_config()

# --- 2. 核心功能类 ---
def get_db_conn():
    return pymysql.connect(host=CONFIG["db"]["host"], user=CONFIG["db"]["user"], password=CONFIG["db"]["pass"], database=CONFIG["db"]["name"], cursorclass=pymysql.cursors.DictCursor)

def hash_password(password, salt=None):
    if not salt: salt = secrets.token_hex(8)
    h = hashlib.sha256((password + salt).encode()).hexdigest()
    return h, salt

class AuditManager:
    def log_action(self, op, action, target, details=""):
        try:
            conn = get_db_conn()
            with conn.cursor() as cursor:
                cursor.execute("INSERT INTO audit_logs (operator, action, target, details) VALUES (%s, %s, %s, %s)", (op, action, target, details))
            conn.commit(); conn.close()
        except: pass

audit_manager = AuditManager()

# --- 3. 业务 API ---
@app.post("/api/auth/login")
async def login(data: dict):
    username = data.get("username")
    password = data.get("password")
    try:
        conn = get_db_conn()
        with conn.cursor() as cursor:
            cursor.execute("SELECT u.*, d.name as dept_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.username = %s", (username,))
            user = cursor.fetchone()
            if not user: return {"status": "error", "message": "账号不存在"}
            h, _ = hash_password(password, user["salt"])
            if h != user["password_hash"]: return {"status": "error", "message": "密钥错误"}
            audit_manager.log_action(username, "LOGIN", "SYSTEM", "登录成功")
            return {"status": "ok", "user": {"username": user["username"], "real_name": user["real_name"], "role": user["role"], "department": user["dept_name"]}, "token": secrets.token_hex(32)}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/admin/stats")
async def get_stats():
    # 模拟数据
    return {"total_risk_today": 42, "active_agents": 12, "ai_correction_rate": "92%"}

# --- 4. 实时引擎 ---
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

# --- 5. 启动 ---
if __name__ == "__main__":
    host = os.getenv("SERVER_HOST", "0.0.0.0")
    port = int(os.getenv("SERVER_PORT", 8000))
    print(f"🚀 Smart-CS Pro 完全体引擎启动 (分布式模式: {host}:{port})")
    uvicorn.run(app, host=host, port=port)
