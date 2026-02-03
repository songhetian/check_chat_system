import json, time, asyncio, re, hashlib, secrets, os, logging, subprocess, shutil, platform
from contextlib import asynccontextmanager
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from tortoise.contrib.fastapi import register_tortoise
from tortoise.expressions import Q
from tortoise.transactions import in_transaction
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

# --- 2. 核心事务业务函数 (Consistency Guard) ---
async def execute_violation_workflow(username: str, keyword: str, context: str, risk_score: int):
    """
    [工业级事务] 违规处理闭环：记录取证记录 + 扣除战术分 + 生成系统通知
    """
    try:
        async with in_transaction() as conn:
            # 1. 锁定并获取用户信息 (防止并发更新分数冲突)
            user = await User.select_for_update().get(username=username)
            
            # 2. 插入违规取证记录
            await ViolationRecord.create(
                id=secrets.token_hex(12),
                user=user,
                keyword=keyword,
                context=context,
                risk_score=risk_score,
                using_db=conn
            )
            
            # 3. 更新战术评分 (逻辑：分数越低越危险)
            user.tactical_score = max(0, user.tactical_score - risk_score)
            await user.save(using_db=conn)
            
            # 4. 生成系统通知
            await Notification.create(
                id=secrets.token_hex(12),
                title="战术拦截：触发高危行为",
                content=f"坐席 {user.real_name} 命中关键词 [{keyword}]，系统已自动扣除 {risk_score} 战术分并完成取证。",
                type="ALERT",
                using_db=conn
            )
            
            # 5. Redis 同步信号
            if redis_client:
                await redis_client.publish("notif_channel", json.dumps({"type": "ALERT", "target": username}))
            
            logger.info(f"🛡️ [事务成功] 违规闭环已完成: {username}")
            return True
    except Exception as e:
        logger.error(f"❌ [事务失败] 违规处理回滚: {e}")
        return False

# --- 3. FastAPI 应用配置 ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis()
    yield
    if redis_client: await redis_client.close()

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

register_tortoise(
    app,
    db_url=f"mysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}",
    modules={"models": ["models"]},
    generate_schemas=False,
    add_exception_handlers=True,
)

# --- 4. API 接口 (已脱敏) ---
@app.get("/api/health")
async def health(): return {"status": "ok", "redis": redis_client is not None}

@app.get("/api/admin/departments")
async def get_departments():
    return {"status": "ok", "data": await Department.filter(is_deleted=0).values("id", "name")}

@app.get("/api/admin/agents")
async def get_agents(page: int = 1, size: int = 10, search: str = "", dept: str = "ALL", status: str = "ALL", risk_level: str = "ALL"):
    offset = (page - 1) * size
    online_keys = await redis_client.keys("online_agent:*") if redis_client else []
    online_usernames = [k.split(":")[1] for k in online_keys]

    query = User.filter(is_deleted=0).select_related("department")
    if search: query = query.filter(Q(username__icontains=search) | Q(real_name__icontains=search))
    if dept != "ALL": query = query.filter(department__name=dept)
    
    if status == "ONLINE": query = query.filter(username__in=online_usernames)
    elif status == "OFFLINE": query = query.exclude(username__in=online_usernames)

    total = await query.count()
    agents_data = await query.limit(size).offset(offset).all()
    
    result = []
    for a in agents_data:
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

@app.post("/api/auth/login")
async def login(data: dict):
    u, p = data.get("username"), data.get("password")
    user = await User.get_or_none(username=u, is_deleted=0).select_related("department")
    if user and u == "admin" and p == "admin123":
        # 记录登录审计 (可加事务)
        return {"status": "ok", "data": {"user": {"username": u, "real_name": user.real_name, "role": user.role, "department": user.department.name if user.department else "指挥部"}, "token": "tk_" + secrets.token_hex(8)}}
    return {"status": "error", "message": "认证拒绝"}

# --- 5. 扫描逻辑集成 ---
class SmartScanner:
    def __init__(self):
        self.ocr = None
        self.last_hash = ""

    async def process(self, text, username="admin"): # 演示用 admin
        # 发现财务违规
        if any(k in text for k in ["钱", "转账", "加微信"]):
            # 调用事务函数
            await execute_violation_workflow(username, "高危交易/引导", text, 10)
            await broadcast_event({"type": "VIOLATION", "keyword": "高危交易", "context": text})

scanner = SmartScanner()

if __name__ == "__main__":
    host, port = os.getenv("SERVER_HOST", "0.0.0.0"), int(os.getenv("SERVER_PORT", 8000))
    print(f"🚀 [战术核心] 架构已加固 (ORM + Transactions): {host}:{port}")
    uvicorn.run(app, host=host, port=port)