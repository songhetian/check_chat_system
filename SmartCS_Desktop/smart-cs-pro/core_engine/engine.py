import json, time, asyncio, re, hashlib, secrets, os, logging, subprocess, shutil, platform
from contextlib import asynccontextmanager
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn, threading, httpx, numpy as np, aiomysql, redis.asyncio as redis
from PIL import ImageGrab
from dotenv import load_dotenv

# --- 1. 环境初始化 ---
load_dotenv()
logger = logging.getLogger("SmartCS")
logger.setLevel(logging.INFO)

# --- 2. 核心连接池 ---
db_pool = None
redis_client = None

async def init_services():
    global db_pool, redis_client
    try:
        db_pool = await aiomysql.create_pool(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", "123456"),
            db=os.getenv("DB_NAME", "smart_cs"),
            autocommit=True
        )
        logger.info("✅ MySQL 联通")
    except Exception as e: logger.error(f"❌ MySQL 失败: {e}")

    try:
        redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "127.0.0.1"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            decode_responses=True
        )
        logger.info("✅ Redis 联通")
    except Exception as e: logger.error(f"❌ Redis 失败: {e}")

# --- 3. 消息持久化函数 ---
async def create_notification(title, content, msg_type="INFO"):
    msg_id = secrets.token_hex(8)
    if db_pool:
        async with db_pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "INSERT INTO notifications (id, title, content, type) VALUES (%s, %s, %s, %s)",
                    (msg_id, title, content, msg_type)
                )
    # Redis 发布通知信号
    if redis_client:
        await redis_client.publish("notif_channel", json.dumps({"id": msg_id, "title": title}))
    return msg_id

# --- 4. FastAPI 路由 ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_services()
    yield
    if db_pool: db_pool.close(); await db_pool.wait_closed()
    if redis_client: await redis_client.close()

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/api/admin/notifications")
async def get_notifications(page: int = 1, size: int = 10, unread_only: bool = False):
    if not db_pool: return {"status": "error", "message": "中枢脱机"}
    where = "WHERE is_read = 0" if unread_only else "WHERE 1=1"
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(f"SELECT * FROM notifications {where} ORDER BY created_at DESC LIMIT %s OFFSET %s", (size, (page-1)*size))
            data = await cur.fetchall()
            await cur.execute(f"SELECT COUNT(*) as total FROM notifications {where}")
            total = await cur.fetchone()
            return {"status": "ok", "data": data, "total": total['total']}

@app.post("/api/admin/notifications/read")
async def mark_read(data: dict):
    msg_id = data.get("id") # 如果 id 为 "ALL" 则标记全部
    async with db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            if msg_id == "ALL":
                await cur.execute("UPDATE notifications SET is_read = 1")
            else:
                await cur.execute("UPDATE notifications SET is_read = 1 WHERE id = %s", (msg_id,))
            return {"status": "ok"}

@app.post("/api/auth/login")
async def login(data: dict):
    u, p = data.get("username"), data.get("password")
    if u == "admin" and p == "admin123":
        await create_notification("指挥官上线", f"高级权限账号 {u} 已接入系统。")
        return {"status": "ok", "data": {"user": {"username":u, "real_name":"指挥官", "role":"ADMIN", "department": "总经办"}}, "token": "tk_admin"}
    return {"status": "error", "message": "凭据失效"}

# 基础 API 保持
@app.get("/api/admin/agents")
async def get_agents(page: int = 1, size: int = 10):
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT username, real_name, role FROM users LIMIT %s OFFSET %s", (size, (page-1)*size))
            return {"status": "ok", "data": await cur.fetchall()}

# 通信逻辑
active_conns = []
@app.websocket("/ws/risk")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept(); active_conns.append(websocket)
    try:
        while True: await websocket.receive_text()
    except: active_conns.remove(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
