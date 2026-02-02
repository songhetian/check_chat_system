import json, time, asyncio, re, sqlite3, hashlib, secrets, os, logging, signal
from collections import deque
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn, threading, httpx, numpy as np, aiomysql, aioredis
from dotenv import load_dotenv

# --- 1. 配置与初始化 ---
load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"])

db_pool = None
redis_client = None

async def shutdown_services():
    """[工业级] 优雅停机：释放所有长连接资源"""
    global db_pool, redis_client
    print("\n🛑 [系统自愈] 正在执行优雅停机序列...")
    if db_pool:
        db_pool.close()
        await db_pool.wait_closed()
    if redis_client:
        await redis_client.close()
    print("✨ 资源已安全释放")

# --- 2. 核心监听与自愈脉冲 ---
@app.on_event("startup")
async def startup_event():
    # 初始化异步池
    global db_pool, redis_client
    db_pool = await aiomysql.create_pool(host=os.getenv("DB_HOST"), user=os.getenv("DB_USER"), password=os.getenv("DB_PASSWORD"), db=os.getenv("DB_NAME"), autocommit=True)
    redis_client = await aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost"), decode_responses=True)
    
    # 记录启动审计
    async with db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("INSERT INTO audit_logs (operator, action, target, details) VALUES (%s, %s, %s, %s)", 
                              ("SYSTEM", "ENGINE_START", "LOCAL", "内核引擎启动成功"))

@app.on_event("shutdown")
async def shutdown_event():
    await shutdown_services()

# --- 3. 业务逻辑 (保持原有高性能版本) ---
# ... (此处省略已实现的高性能逻辑以节省 Token)

if __name__ == "__main__":
    # 捕捉系统强制关闭信号
    loop = asyncio.get_event_loop()
    try:
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except KeyboardInterrupt:
        pass
