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
handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)

def get_mysql_conn():
    return pymysql.connect(
        host=os.getenv("DB_HOST"), 
        user=os.getenv("DB_USER"), 
        password=os.getenv("DB_PASSWORD"), 
        database=os.getenv("DB_NAME"), 
        cursorclass=pymysql.cursors.DictCursor
    )

# --- 2. 核心同步引擎 (The Sync Bridge) ---
class IndustrialSyncManager:
    def __init__(self):
        self.local_db = "buffer.db"
        self._init_local_buffer()

    def _init_local_buffer(self):
        with sqlite3.connect(self.local_db) as conn:
            conn.execute("CREATE TABLE IF NOT EXISTS pending_sync (id TEXT PRIMARY KEY, type TEXT, payload TEXT, ts REAL)")

    def add_to_sync_queue(self, data_type, payload):
        """当 MySQL 连接失败时，暂存到本地 SQLite"""
        sync_id = secrets.token_hex(16)
        with sqlite3.connect(self.local_db) as conn:
            conn.execute("INSERT INTO pending_sync VALUES (?, ?, ?, ?)", (sync_id, data_type, json.dumps(payload), time.time()))
        logger.warning(f"📦 链路中断，数据已转入本地缓冲: {data_type}")

    async def run_sync_worker(self):
        """[核心] 后台同步进程：将 SQLite 数据推送到 MySQL"""
        print("☁️  数据同步守护进程已启动")
        while True:
            try:
                with sqlite3.connect(self.local_db) as local_conn:
                    cursor = local_conn.cursor()
                    cursor.execute("SELECT * FROM pending_sync LIMIT 5")
                    tasks = cursor.fetchall()
                    
                    if tasks:
                        # 尝试连接 MySQL
                        remote_conn = get_mysql_conn()
                        with remote_conn.cursor() as remote_cursor:
                            for tid, ttype, tpayload, tts in tasks:
                                data = json.loads(tpayload)
                                if ttype == "VIOLATION":
                                    # 真实写入 MySQL 违规表
                                    remote_cursor.execute(
                                        "INSERT INTO violation_records (id, user_id, keyword, context, risk_score) VALUES (%s, %s, %s, %s, %s)",
                                        (tid, 1, data.get('keyword'), data.get('context'), data.get('risk_score', 0))
                                    )
                                elif ttype == "PERSONA":
                                    # 真实同步画像到 MySQL
                                    remote_cursor.execute(
                                        "INSERT INTO customers (name, level, tags, ltv) VALUES (%s, %s, %s, %s) ON DUPLICATE KEY UPDATE ltv=ltv+%s",
                                        (data['name'], data['level'], ",".join(data['tags']), data['ltv'], data['ltv'])
                                    )
                            remote_conn.commit()
                            # 同步成功后清理本地缓冲
                            ids = [t[0] for t in tasks]
                            local_conn.execute(f"DELETE FROM pending_sync WHERE id IN ({','.join(['?']*len(ids))})", ids)
                            logger.info(f"✨ 已完成 {len(ids)} 条数据上云同步")
                        remote_conn.close()
            except Exception as e:
                # logger.error(f"同步链路忙碌或异常: {e}")
                pass
            await asyncio.sleep(10) # 10秒检查一次

sync_manager = IndustrialSyncManager()

# --- 3. 拦截业务逻辑 ---
async def process_violation(data):
    """
    [高可靠模式] 优先写云端，失败自动切本地缓冲
    """
    try:
        conn = get_mysql_conn()
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO violation_records (id, user_id, keyword, context) VALUES (%s, %s, %s, %s)",
                           (secrets.token_hex(8), 1, data['keyword'], data['context']))
        conn.commit(); conn.close()
        logger.info("🚀 违规数据已实时上报 MySQL")
    except:
        sync_manager.add_to_sync_queue("VIOLATION", data)

# --- 4. 实时指令总线 ---
active_connections = []
async def broadcast_event(data):
    if data["type"] == "VIOLATION":
        await process_violation(data)
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
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    # 启动同步守护进程
    loop.create_task(sync_manager.run_sync_worker())
    
    config = {"host": os.getenv("SERVER_HOST", "0.0.0.0"), "port": int(os.getenv("SERVER_PORT", 8000))}
    threading.Thread(target=lambda: uvicorn.run(app, host=config["host"], port=config["port"]), daemon=True).start()
    print(f"🚀 Smart-CS Pro 工业级同步引擎已启动: {config['host']}:{config['port']}")
    loop.run_forever()