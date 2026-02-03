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

# --- 3. 消息发布与持久化中枢 ---
async def save_and_broadcast_msg(title, content, type="INFO"):
    """核心：Redis 广播 + MySQL 存证"""
    msg_id = secrets.token_hex(8)
    payload = {
        "id": msg_id,
        "title": title,
        "content": content,
        "type": type,
        "time": time.strftime("%H:%M:%S"),
        "is_read": False
    }
    # 1. 存入 MySQL (audit_logs 作为消息载体)
    if db_pool:
        async with db_pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "INSERT INTO audit_logs (operator, action, details, timestamp) VALUES (%s, %s, %s, %s)",
                    ("SYSTEM", type, json.dumps(payload), time.time())
                )
    
    # 2. Redis 广播给所有大屏和管理端
    if redis_client:
        await redis_client.publish("system_notifications", json.dumps(payload))
    
    # 3. 内存 WebSocket 实时推送
    await broadcast_event({"type": "NEW_NOTIFICATION", "data": payload})

# --- 4. FastAPI 路由 ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_services()
    yield
    if db_pool: db_pool.close(); await db_pool.wait_closed()
    if redis_client: await redis_client.close()

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/api/health")
async def health(): return {"status": "ok", "db": db_pool is not None, "redis": redis_client is not None}

@app.post("/api/auth/login")
async def login(data: dict):
    u, p = data.get("username"), data.get("password")
    if u == "admin" and p == "admin123":
        await save_and_broadcast_msg("管理员登录", f"操作员 {u} 已成功接入战术中枢")
        return {"status": "ok", "data": {"user": {"username":u, "real_name":"高级指挥官", "role":"ADMIN", "department": "总经办"}, "token": "tk_admin"}}
    return {"status": "error", "message": "凭据失效"}

@app.get("/api/admin/agents")
async def get_agents(page: int = 1, size: int = 10):
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT username, real_name, role FROM users LIMIT %s OFFSET %s", (size, (page-1)*size))
            return {"status": "ok", "data": await cur.fetchall()}

# --- 5. 通信中枢 ---
active_conns = []
async def broadcast_event(data):
    for c in active_conns:
        try: await c.send_text(json.dumps(data))
        except: pass

@app.websocket("/ws/risk")
async def websocket_endpoint(websocket: WebSocket, username: str = "guest"):
    await websocket.accept(); active_conns.append(websocket)
    try:
        while True:
            msg = await websocket.receive_text()
            # 心跳或业务指令处理
    except:
        active_conns.remove(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)