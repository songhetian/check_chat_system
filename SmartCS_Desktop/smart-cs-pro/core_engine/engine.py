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

# --- 2. 核心连接池 (MySQL + Redis) ---
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

# --- 3. 业务逻辑组件 ---
class AIAnalyzer:
    def __init__(self):
        self.api_url = os.getenv("AI_URL", "http://127.0.0.1:11434/api/chat")
        self.is_healthy = False
    async def check_health(self):
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(self.api_url.split('/api')[0])
                self.is_healthy = resp.status_code == 200
        except: self.is_healthy = False
        return self.is_healthy
    async def analyze(self, context):
        if not self.is_healthy: return None
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                payload = { "model": os.getenv("AI_MODEL", "qwen2:1.5b"), "messages": [{"role": "user", "content": context}], "stream": False, "format": "json" }
                resp = await client.post(self.api_url, json=payload)
                return json.loads(resp.json()['message']['content'])
        except: return None

ai_analyzer = AIAnalyzer()

# --- 4. FastAPI 应用与路由 ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_services()
    asyncio.create_task(ai_analyzer.check_health())
    yield
    if db_pool: db_pool.close(); await db_pool.wait_closed()
    if redis_client: await redis_client.close()

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/api/health")
async def health(): return {"status": "ok", "db": db_pool is not None, "redis": redis_client is not None}

# 1. 坐席管理 API
@app.get("/api/admin/agents")
async def get_agents(page: int = 1, size: int = 10, search: str = "", dept: str = "ALL"):
    if not db_pool: return {"status": "error", "message": "核心链路脱机"}
    offset = (page - 1) * size
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            where = "WHERE 1=1"
            params = []
            if search:
                where += " AND (u.username LIKE %s OR u.real_name LIKE %s)"
                params.extend([f"%{search}%", f"%{search}%"])
            if dept != "ALL":
                where += " AND d.name = %s"
                params.append(dept)
            
            sql = f"SELECT u.*, d.name as dept_name FROM users u LEFT JOIN departments d ON u.department_id = d.id {where} LIMIT %s OFFSET %s"
            params.extend([size, offset])
            await cur.execute(sql, params)
            agents = await cur.fetchall()
            for a in agents:
                a['is_online'] = bool(await redis_client.exists(f"online_agent:{a['username']}"))
            return {"status": "ok", "data": agents}

# 2. 客户画像 API (真正从 MySQL 获取)
@app.get("/api/admin/customers")
async def get_customers(page: int = 1, size: int = 10, search: str = ""):
    if not db_pool: return {"status": "error", "message": "数据中枢脱机"}
    offset = (page - 1) * size
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            where = ""
            params = [size, offset]
            if search:
                where = "WHERE name LIKE %s OR tags LIKE %s"
                params = [f"%{search}%", f"%{search}%", size, offset]
            
            await cur.execute(f"SELECT * FROM customers {where} ORDER BY last_seen_at DESC LIMIT %s OFFSET %s", params)
            data = await cur.fetchall()
            await cur.execute(f"SELECT COUNT(*) as total FROM customers {where}", params[:-2] if search else [])
            total = await cur.fetchone()
            return {"status": "ok", "data": data, "total": total['total']}

@app.post("/api/auth/login")
async def login(data: dict):
    u, p = data.get("username"), data.get("password")
    if not db_pool: return {"status": "error", "message": "神经链路脱机"}
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT * FROM users WHERE username = %s", (u,))
            user = await cur.fetchone()
            if u == "admin" and p == "admin123":
                await redis_client.setex(f"online_agent:{u}", 3600, "ADMIN")
                return {"status": "ok", "data": {"user": {"username":u, "real_name":user['real_name'], "role":user['role'], "department": "总经办"}, "token": "tk_admin"}}
            return {"status": "error", "message": "凭据失效"}

# --- 5. 通信中枢 ---
active_conns = []
async def broadcast_event(data):
    for c in active_conns:
        try: await c.send_text(json.dumps(data))
        except: pass

@app.websocket("/ws/risk")
async def websocket_endpoint(websocket: WebSocket, username: str = "guest"):
    await websocket.accept(); active_conns.append(websocket)
    if redis_client:
        await redis_client.setex(f"online_agent:{username}", 60, "ACTIVE")
    try:
        while True:
            await websocket.receive_text()
            await redis_client.expire(f"online_agent:{username}", 60)
    except:
        active_conns.remove(websocket)
        if redis_client: await redis_client.delete(f"online_agent:{username}")

if __name__ == "__main__":
    host, port = os.getenv("SERVER_HOST", "0.0.0.0"), int(os.getenv("SERVER_PORT", 8000))
    print(f"🚀 [核心引擎] 已拉起: {host}:{port}")
    uvicorn.run(app, host=host, port=port)
