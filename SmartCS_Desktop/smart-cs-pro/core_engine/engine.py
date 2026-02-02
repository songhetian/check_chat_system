import json, time, asyncio, re, sqlite3, hashlib, secrets, os, logging
from collections import deque
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn, threading, httpx, numpy as np
import aiomysql
import aioredis # 升级为异步 Redis 驱动
from dotenv import load_dotenv

# --- 1. 初始化 ---
load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

db_pool = None
redis_client = None

async def init_services():
    global db_pool, redis_client
    # 1. 异步数据库池
    db_pool = await aiomysql.create_pool(
        host=os.getenv("DB_HOST"), user=os.getenv("DB_USER"), 
        password=os.getenv("DB_PASSWORD"), db=os.getenv("DB_NAME"), autocommit=True
    )
    # 2. 异步 Redis 客户端 (极致性能点)
    redis_client = await aioredis.from_url(
        os.getenv("REDIS_URL", "redis://localhost"), 
        decode_responses=True
    )
    print("⚡ [性能引擎] 异步数据库 + Redis 缓存层已就绪")

# --- 2. 战术查询引擎 (带缓存逻辑) ---
async def get_cached_persona(name):
    """
    [极致响应] 优先查缓存，缓存不中再查库
    """
    cache_key = f"persona:{name}"
    # 1. 尝试从内存读取
    cached = await redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # 2. 缓存未中，穿透到 MySQL
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT * FROM customers WHERE name = %s", (name,))
            user = await cur.fetchone()
            if user:
                # 3. 回填缓存，有效期 1 小时
                await redis_client.setex(cache_key, 3600, json.dumps(user))
                return user
    return None

# --- 3. 业务 API 与生命周期 ---
@app.on_event("startup")
async def startup_event():
    await init_services()

@app.websocket("/ws/risk")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            if data["type"] == "CUSTOMER_DETECTED":
                # 瞬间响应：从缓存调取画像
                profile = await get_cached_persona(data["name"])
                if profile:
                    await websocket.send_text(json.dumps({"type": "trigger-customer", "detail": profile}))
    except: pass

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)