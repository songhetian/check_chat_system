import json, time, asyncio, re, hashlib, secrets, os, logging, subprocess, shutil, platform
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from tortoise.contrib.fastapi import register_tortoise
import uvicorn, redis.asyncio as redis
from dotenv import load_dotenv

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
logging.basicConfig(level=logging.INFO)

# --- 2. 物理链路指挥管理器 ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, username: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[username] = websocket
        logger.info(f"📡 [WS] 节点已挂载: {username}")

    def disconnect(self, username: str):
        if username in self.active_connections:
            del self.active_connections[username]
            logger.info(f"🔌 [WS] 节点已脱机: {username}")

    async def send_personal_message(self, message: dict, username: str):
        if username in self.active_connections:
            await self.active_connections[username].send_json(message)

    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)

manager = ConnectionManager()

# --- 3. FastAPI 应用配置 ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 初始化 Redis
    from utils.redis_utils import redis_mgr
    client = await redis_mgr.connect()
    if client:
        app.state.redis = client
        logger.info("✅ Redis 战术缓存已激活")
    else:
        logger.error("❌ Redis 初始化失败")
    
    app.state.ws_manager = manager
    yield
    await redis_mgr.disconnect()

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# 核心：系统级接口 (确保路径与 CONFIG.API_BASE 对齐)
@app.get("/api/health")
async def health(request: Request): 
    return {
        "status": "ok", 
        "redis": hasattr(request.app.state, 'redis'),
        "engine": "SmartCS-Pro-V2",
        "nodes": len(manager.active_connections)
    }

# 挂载业务路由 (所有路由均已带 /api 前缀)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(violation_router)
app.include_router(coach_router)
app.include_router(growth_router)
app.include_router(rbac_router)
app.include_router(ai_router)

# --- 4. WebSocket 战术链路 ---
@app.websocket("/api/ws/risk")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...), username: str = Query(...)):
    await manager.connect(username, websocket)
    redis_conn = app.state.redis
    if redis_conn: 
        await redis_conn.sadd("online_agents_set", username)
        await manager.broadcast({"type": "TACTICAL_NODE_SYNC", "username": username, "status": "ONLINE"})
    
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "CHAT_TRANSMISSION":
                # 战术加固：实时扫描内容敏感词
                from core.services import SmartScanner
                scanner = SmartScanner()
                content = msg.get("content", "")
                await scanner.process(content, username=username, redis_client=app.state.redis, ws_manager=manager)
                
                await manager.broadcast({
                    "type": "LIVE_CHAT",
                    "username": username,
                    "content": content,
                    "target": msg.get("target")
                })
            elif msg.get("type") == "SCREEN_SYNC":
                # 转发画面载荷至指挥中心
                await manager.broadcast({
                    "type": "SCREEN_SYNC",
                    "username": username,
                    "payload": msg.get("payload")
                })
    except WebSocketDisconnect:
        manager.disconnect(username)
        if redis_conn: 
            await redis_conn.srem("online_agents_set", username)
            await manager.broadcast({"type": "TACTICAL_NODE_SYNC", "username": username, "status": "OFFLINE"})
    except Exception as e:
        logger.error(f"⚠️ WS 链路异常: {e}")
        manager.disconnect(username)
        if redis_conn: 
            await redis_conn.srem("online_agents_set", username)
            await manager.broadcast({"type": "TACTICAL_NODE_SYNC", "username": username, "status": "OFFLINE"})

# --- 5. 物理引擎挂载 ---
register_tortoise(
    app,
    db_url=f"mysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}",
    modules={"models": ["core.models"]},
    generate_schemas=False,
    add_exception_handlers=True,
)

if __name__ == "__main__":
    host, port = os.getenv("SERVER_HOST", "0.0.0.0"), int(os.getenv("SERVER_PORT", 8000))
    print(f"🚀 [战术核心] 架构标准化重塑完成: {host}:{port}")
    
    # 智能驱动自适应：检测环境是否支持高性能 WebSocket
    ws_driver = "auto"
    try:
        import websockets
        ws_driver = "websockets"
        print("  ✅ 已激活 websockets 高性能驱动")
    except ImportError:
        print("  ⚠️  未检测到 websockets 库，将使用 uvicorn 默认驱动")

    uvicorn.run(app, host=host, port=port, ws=ws_driver)
