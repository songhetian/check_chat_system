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
    # MySQL 初始化
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

    # Redis 初始化
    try:
        redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "127.0.0.1"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            decode_responses=True
        )
        logger.info("✅ Redis 联通")
    except Exception as e: logger.error(f"❌ Redis 失败: {e}")

# --- 3. 业务逻辑组件 (AI & Scanner) ---
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

# 坐席列表 API (带搜索、筛选、分页)
@app.get("/api/admin/agents")
async def get_agents(
    page: int = 1, 
    size: int = 10, 
    search: str = "", 
    dept: str = "ALL", 
    status: str = "ALL"
):
    if not db_pool: return {"status": "error", "message": "DB Offline"}
    offset = (page - 1) * size
    
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            # 构建 SQL
            where_clauses = ["1=1"]
            params = []
            if search:
                where_clauses.append("(u.username LIKE %s OR u.real_name LIKE %s)")
                params.extend([f"%{search}%", f"%{search}%"])
            if dept != "ALL":
                where_clauses.append("d.name = %s")
                params.append(dept)
            
            sql = f"""
                SELECT u.username, u.real_name, u.role, u.status as db_status, 
                       u.tactical_score, d.name as dept_name
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.id
                WHERE {" AND ".join(where_clauses)}
                LIMIT %s OFFSET %s
            """
            params.extend([size, offset])
            await cur.execute(sql, params)
            agents = await cur.fetchall()
            
            # 实时合并 Redis 中的在线状态
            for a in agents:
                is_online = await redis_client.exists(f"online_agent:{a['username']}")
                a['is_online'] = bool(is_online)
                # 模拟违规标记
                a['has_violation'] = await redis_client.exists(f"violation_alert:{a['username']}")

            return {"status": "ok", "data": agents, "total": 100} # 简化 total

@app.post("/api/auth/login")
async def login(data: dict):
    u, p = data.get("username"), data.get("password")
    if not db_pool: return {"status": "error", "message": "中枢脱机"}
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT * FROM users WHERE username = %s", (u,))
            user = await cur.fetchone()
            if u == "admin" and p == "admin123":
                # 记录管理员上线
                await redis_client.setex(f"online_agent:{u}", 3600, "ADMIN")
                return {"status": "ok", "data": {"user": {"username":u, "real_name":user['real_name'], "role":user['role'], "department": "总经办"}, "token": "tk_admin"}}
            return {"status": "error", "message": "凭据失效"}

# --- 5. 通信与订阅 ---
active_conns = []

@app.websocket("/ws/risk")
async def websocket_endpoint(websocket: WebSocket, username: str = "guest"):
    await websocket.accept()
    active_conns.append(websocket)
    
    # 坐席上线，写入 Redis
    if redis_client:
        await redis_client.setex(f"online_agent:{username}", 60, "ACTIVE")
        await redis_client.publish("agent_status", json.dumps({"username": username, "status": "ONLINE"}))
    
    try:
        while True:
            # 维持连接并更新心跳
            await websocket.receive_text()
            await redis_client.expire(f"online_agent:{username}", 60)
    except:
        active_conns.remove(websocket)
        if redis_client:
            await redis_client.delete(f"online_agent:{username}")
            await redis_client.publish("agent_status", json.dumps({"username": username, "status": "OFFLINE"}))

if __name__ == "__main__":
    host = os.getenv("SERVER_HOST", "0.0.0.0")
    port = int(os.getenv("SERVER_PORT", 8000))
    print(f"🚀 [数智核心] 引擎已拉起: {host}:{port}")
    uvicorn.run(app, host=host, port=port)