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
                await cur.execute("INSERT INTO notifications (id, title, content, type) VALUES (%s, %s, %s, %s)", (msg_id, title, content, msg_type))
    if redis_client:
        await redis_client.publish("notif_channel", json.dumps({"id": msg_id, "title": title}))
    return msg_id

# --- 4. 业务逻辑组件 ---
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

ai_analyzer = AIAnalyzer()

# --- 5. FastAPI 应用与路由 ---
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

# 1. 动态部门列表 API
@app.get("/api/admin/departments")
async def get_departments():
    if not db_pool: return {"status": "error", "message": "脱机"}
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT id, name FROM departments")
            return {"status": "ok", "data": await cur.fetchall()}

# 2. 坐席管理 API
@app.get("/api/admin/agents")
async def get_agents(
    page: int = 1, 
    size: int = 10, 
    search: str = "", 
    dept: str = "ALL", 
    status: str = "ALL",
    risk_level: str = "ALL"
):
    if not db_pool: return {"status": "error", "message": "核心链路脱机"}
    offset = (page - 1) * size
    
    online_keys = await redis_client.keys("online_agent:*") if redis_client else []
    online_usernames = [k.split(":")[1] for k in online_keys]

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
            
            if risk_level == "SERIOUS": 
                where += " AND EXISTS (SELECT 1 FROM violation_records vr WHERE vr.user_id = u.id AND vr.risk_score >= 9)"
            elif risk_level == "MEDIUM": 
                where += " AND EXISTS (SELECT 1 FROM violation_records vr WHERE vr.user_id = u.id AND vr.risk_score BETWEEN 5 AND 8)"
            elif risk_level == "LOW": 
                where += " AND EXISTS (SELECT 1 FROM violation_records vr WHERE vr.user_id = u.id AND vr.risk_score < 5)"

            if status == "ONLINE":
                if not online_usernames: where += " AND 1=0"
                else:
                    where += f" AND u.username IN ({','.join(['%s']*len(online_usernames))})"
                    params.extend(online_usernames)
            elif status == "OFFLINE":
                if online_usernames:
                    where += f" AND u.username NOT IN ({','.join(['%s']*len(online_usernames))})"
                    params.extend(online_usernames)

            sql = f"""
                SELECT u.*, d.name as dept_name, 
                (SELECT keyword FROM violation_records WHERE user_id = u.id ORDER BY timestamp DESC LIMIT 1) as last_violation_type,
                (SELECT risk_score FROM violation_records WHERE user_id = u.id ORDER BY timestamp DESC LIMIT 1) as last_risk_score
                FROM users u 
                LEFT JOIN departments d ON u.department_id = d.id 
                {where} 
                LIMIT %s OFFSET %s
            """
            params.extend([size, offset])
            await cur.execute(sql, params)
            agents = await cur.fetchall()
            
            await cur.execute(f"SELECT COUNT(*) as total FROM users u LEFT JOIN departments d ON u.department_id = d.id {where}", params[:-2] if params else [])
            total_data = await cur.fetchone()
            
            for a in agents:
                a['is_online'] = a['username'] in online_usernames
                if 'ltv' in a and a['ltv']: a['ltv'] = float(a['ltv'])
            
            return {"status": "ok", "data": agents, "total": total_data['total']}

# 3. 通知中枢 API
@app.get("/api/admin/notifications")
async def get_notifications(page: int = 1, size: int = 10):
    if not db_pool: return {"status": "error", "message": "脱机"}
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT %s OFFSET %s", (size, (page-1)*size))
            data = await cur.fetchall()
            await cur.execute("SELECT COUNT(*) as total FROM notifications")
            total = await cur.fetchone()
            return {"status": "ok", "data": data, "total": total['total']}

@app.post("/api/admin/notifications/read")
async def mark_read(data: dict):
    msg_id = data.get("id")
    async with db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            if msg_id == "ALL": await cur.execute("UPDATE notifications SET is_read = 1")
            else: await cur.execute("UPDATE notifications SET is_read = 1 WHERE id = %s", (msg_id,))
            return {"status": "ok"}

@app.post("/api/auth/login")
async def login(data: dict):
    u, p = data.get("username"), data.get("password")
    if not db_pool: return {"status": "error", "message": "脱机"}
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT * FROM users WHERE username = %s", (u,))
            user = await cur.fetchone()
            if u == "admin" and p == "admin123":
                await create_notification("系统接入", f"指挥官 {u} 已上线")
                return {"status": "ok", "data": {"user": {"username":u, "real_name":user['real_name'], "role":"ADMIN", "department": "指挥部"}}, "token": "tk_admin"}
            return {"status": "error", "message": "凭据失效"}

# 通信
active_conns = []
@app.websocket("/ws/risk")
async def websocket_endpoint(websocket: WebSocket, username: str = "guest"):
    await websocket.accept(); active_conns.append(websocket)
    if redis_client: await redis_client.setex(f"online_agent:{username}", 60, "ACTIVE")
    try:
        while True:
            await websocket.receive_text()
            await redis_client.expire(f"online_agent:{username}", 60)
    except:
        active_conns.remove(websocket)
        if redis_client: await redis_client.delete(f"online_agent:{username}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
