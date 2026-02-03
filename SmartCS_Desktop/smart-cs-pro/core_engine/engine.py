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

# 引入核心层
from core.models import User, Department, Notification, Customer, ViolationRecord
from core.services import execute_violation_workflow, SmartScanner
from utils.redis_utils import redis_mgr

# 引入路由
from api.auth import router as auth_router
from api.admin import router as admin_router
from api.violation import router as violation_router
from api.coach import router as coach_router
from api.growth import router as growth_router
from api.rbac import router as rbac_router
from api.ai_config import router as ai_router

# --- 1. 环境初始化 ---
load_dotenv()
logger = logging.getLogger("SmartCS")
logger.setLevel(logging.INFO)

# 确保日志目录存在
os.makedirs("logs", exist_ok=True)

async def init_redis():
    client = await redis_mgr.connect()
    if client:
        app.state.redis = client
    else:
        logger.error("❌ Redis 初始化失败，部分功能可能受限")

# --- 2. FastAPI 应用配置 ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis()
    yield
    await redis_mgr.disconnect()

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# 注册路由
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(violation_router)
app.include_router(coach_router)
app.include_router(growth_router)
app.include_router(rbac_router)
app.include_router(ai_router)

register_tortoise(
    app,
    db_url=f"mysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}",
    modules={"models": ["core.models"]},
    generate_schemas=False,
    add_exception_handlers=True,
)

# --- 3. 系统级接口 ---
@app.get("/api/health")
async def health(request: Request): 
    return {"status": "ok", "redis": request.app.state.redis is not None}

# --- 4. 扫描实例初始化 ---
scanner = SmartScanner()

if __name__ == "__main__":
    host, port = os.getenv("SERVER_HOST", "0.0.0.0"), int(os.getenv("SERVER_PORT", 8000))
    print(f"🚀 [战术核心] 架构重构完成 (Modular Structure): {host}:{port}")
    uvicorn.run(app, host=host, port=port)