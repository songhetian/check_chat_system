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

# --- 4. 业务逻辑组件 (AI & Scanner) ---
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

# 1. 坐席管理 API (全维度筛选)
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
    
    # A. 获取 Redis 在线列表以支持状态过滤
    online_keys = await redis_client.keys("online_agent:*")
    online_usernames = [k.split(":")[1] for k in online_keys]

    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            where = "WHERE 1=1"
            params = []
            
            # 1. 关键词搜索
            if search:
                where += " AND (u.username LIKE %s OR u.real_name LIKE %s)"
                params.extend([f"%{search}%", f"%{search}%"])
            
            # 2. 部门过滤
            if dept != "ALL":
                where += " AND d.name = %s"
                params.append(dept)
            
            # 3. 风险等级过滤 (模拟逻辑：基于 tactical_score 划分)
            if risk_level == "SERIOUS": where += " AND u.tactical_score < 60"
            elif risk_level == "MEDIUM": where += " AND u.tactical_score BETWEEN 60 AND 85"
            elif risk_level == "LOW": where += " AND u.tactical_score > 85"

            # 4. 在线状态过滤 (关键：在 SQL 中使用 Redis 的结果)
            if status == "ONLINE":
                if not online_usernames: where += " AND 1=0" # 没人在线
                else:
                    where += f" AND u.username IN ({','.join(['%s']*len(online_usernames))})"
                    params.extend(online_usernames)
            elif status == "OFFLINE":
                if online_usernames:
                    where += f" AND u.username NOT IN ({','.join(['%s']*len(online_usernames))})"
                    params.extend(online_usernames)

            # 数据查询 (关联违规记录表以获取最新异常类型)
            sql = f"""
                SELECT u.*, d.name as dept_name, 
                (SELECT keyword FROM violation_records WHERE user_id = u.id ORDER BY timestamp DESC LIMIT 1) as last_violation_type
                FROM users u 
                LEFT JOIN departments d ON u.department_id = d.id 
                {where} 
                LIMIT %s OFFSET %s
            """
            params.extend([size, offset])
            await cur.execute(sql, params)
            agents = await cur.fetchall()
            
            # 总数统计
            await cur.execute(f"SELECT COUNT(*) as total FROM users u LEFT JOIN departments d ON u.department_id = d.id {where}", params[:-2] if params else [])
            total_data = await cur.fetchone()
            
            for a in agents:
                a['is_online'] = a['username'] in online_usernames
                # 转换 Decimal 为 float 以便 JSON 序列化
                if 'ltv' in a and a['ltv']: a['ltv'] = float(a['ltv'])
            
            return {"status": "ok", "data": agents, "total": total_data['total']}

# 2. 客户画像 API
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
            # 处理 Decimal
            for d in data:
                if 'ltv' in d and d['ltv']: d['ltv'] = float(d['ltv'])
            await cur.execute(f"SELECT COUNT(*) as total FROM customers {where}", params[:-2] if search else [])
            total = await cur.fetchone()
            return {"status": "ok", "data": data, "total": total['total']}

# 3. 通知中枢 API
@app.get("/api/admin/notifications")
async def get_notifications(page: int = 1, size: int = 10):
    if not db_pool: return {"status": "error", "message": "神经链路脱机"}
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT %s OFFSET %s", (size, (page-1)*size))
            return {"status": "ok", "data": await cur.fetchall(), "total": 100} # 简化

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
    if u == "admin" and p == "admin123":
        await create_notification("系统接入", f"高级权限账号 {u} 已接入战术指挥链路。")
        return {"status": "ok", "data": {"user": {"username":u, "real_name":"高级指挥官", "role":"ADMIN", "department": "总经办"}}, "token": "tk_admin"}
    return {"status": "error", "message": "凭据失效"}

# 通信
active_conns = []
async def broadcast_event(data):
    for c in active_conns:
        try: await c.send_text(json.dumps(data))
        except: pass

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
