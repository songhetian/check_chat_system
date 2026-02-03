import json, time, asyncio, re, hashlib, secrets, os, logging, subprocess, shutil, platform
from contextlib import asynccontextmanager
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from tortoise.contrib.fastapi import register_tortoise
from tortoise.expressions import Q
import uvicorn, threading, httpx, numpy as np, redis.asyncio as redis
from PIL import ImageGrab
from dotenv import load_dotenv

# 引入 ORM 模型
from models import User, Department, Notification, Customer, ViolationRecord

# --- 1. 环境初始化 ---
load_dotenv()
logger = logging.getLogger("SmartCS")
logger.setLevel(logging.INFO)

redis_client = None

async def init_redis():
    global redis_client
    try:
        redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "127.0.0.1"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            decode_responses=True
        )
        logger.info("✅ Redis 联通")
    except Exception as e: logger.error(f"❌ Redis 失败: {e}")

# --- 2. FastAPI 应用配置 ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis()
    yield
    if redis_client: await redis_client.close()

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# 注册 Tortoise ORM (自动管理连接池)
register_tortoise(
    app,
    db_url=f"mysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}",
    modules={"models": ["models"]},
    generate_schemas=False,
    add_exception_handlers=True,
)

@app.get("/api/health")
async def health(): return {"status": "ok", "redis": redis_client is not None}

# 1. 部门 API (ORM 优化)
@app.get("/api/admin/departments")
async def get_departments():
    data = await Department.filter(is_deleted=0).values("id", "name")
    return {"status": "ok", "data": data}

# 2. 坐席管理 API (ORM 关联查询 + 效率优化)
@app.get("/api/admin/agents")
async def get_agents(page: int = 1, size: int = 10, search: str = "", dept: str = "ALL", status: str = "ALL", risk_level: str = "ALL"):
    offset = (page - 1) * size
    
    # 获取在线列表
    online_keys = await redis_client.keys("online_agent:*") if redis_client else []
    online_usernames = [k.split(":")[1] for k in online_keys]

    # 构建基础查询 (优化：使用 select_related 一次性 JOIN 部门表)
    query = User.filter(is_deleted=0).select_related("department")
    
    if search:
        query = query.filter(Q(username__icontains=search) | Q(real_name__icontains=search))
    if dept != "ALL":
        query = query.filter(department__name=dept)
    
    # 在线过滤
    if status == "ONLINE":
        query = query.filter(username__in=online_usernames)
    elif status == "OFFLINE":
        query = query.exclude(username__in=online_usernames)

    # 风险等级过滤 (ORM 表达优化)
    if risk_level == "SERIOUS": query = query.filter(violations__risk_score__gte=9).distinct()
    elif risk_level == "MEDIUM": query = query.filter(violations__risk_score__range=(5, 8)).distinct()
    elif risk_level == "LOW": query = query.filter(violations__risk_score__lt=5).distinct()

    total = await query.count()
    agents_data = await query.limit(size).offset(offset).all()
    
    # 转换为前端格式 (优化：使用 Pydantic 之前先手动映射，减少内存拷贝)
    result = []
    for a in agents_data:
        # 获取最新一条违规 (ORM 优化)
        last_v = await ViolationRecord.filter(user=a, is_deleted=0).order_by("-timestamp").first()
        result.append({
            "username": a.username,
            "real_name": a.real_name,
            "role": a.role,
            "dept_name": a.department.name if a.department else "未归类",
            "is_online": a.username in online_usernames,
            "tactical_score": a.tactical_score,
            "last_violation_type": last_v.keyword if last_v else None,
            "last_risk_score": last_v.risk_score if last_v else 0
        })
    
    return {"status": "ok", "data": result, "total": total}

# 3. 客户画像 API
@app.get("/api/admin/customers")
async def get_customers(page: int = 1, size: int = 10, search: str = ""):
    query = Customer.filter(is_deleted=0)
    if search:
        query = query.filter(Q(name__icontains=search) | Q(tags__icontains=search))
    
    total = await query.count()
    data = await query.order_by("-last_seen_at").limit(size).offset(offset).values()
    return {"status": "ok", "data": data, "total": total}

# 4. 认证逻辑 (ORM 版)
@app.post("/api/auth/login")
async def login(data: dict):
    u, p = data.get("username"), data.get("password")
    user = await User.get_or_none(username=u, is_deleted=0).select_related("department")
    if user and u == "admin" and p == "admin123":
        return {
            "status": "ok", 
            "data": {
                "user": {
                    "username": u, 
                    "real_name": user.real_name, 
                    "role": user.role, 
                    "department": user.department.name if user.department else "指挥部"
                }, 
                "token": "tk_" + secrets.token_hex(8)
            }
        }
    return {"status": "error", "message": "身份特征认证失败"}

# --- 通信 ---
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
