import json, time, asyncio, re, hashlib, secrets, os, logging, subprocess, shutil, platform, sys
from contextlib import asynccontextmanager

# 强制设置标准输出编码为 UTF-8，解决 Windows 环境乱码
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from tortoise.contrib.fastapi import register_tortoise
import uvicorn, redis.asyncio as redis
from dotenv import load_dotenv

# 引入路由
from api.auth import router as auth_router
from api.admin import router as admin_router
from api.violation import router as violation_router
from core.constants import RoleID
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
        self.user_roles: dict[str, str] = {} # 存储节点角色

    async def connect(self, username: str, websocket: WebSocket, role: str = "AGENT"):
        await websocket.accept()
        self.active_connections[username] = websocket
        self.user_roles[username] = role
        logger.info(f"📡 [WS] 节点已挂载: {username} ({role})")

    def disconnect(self, username: str):
        if username in self.active_connections:
            del self.active_connections[username]
            if username in self.user_roles: del self.user_roles[username]
            logger.info(f"🔌 [WS] 节点已脱机: {username}")

    async def broadcast_to_command(self, message: dict):
        """
        [物理隔离] 仅向 ADMIN 和 HQ 节点推送敏感数据 (如画面、求助)
        """
        for user, connection in self.active_connections.items():
            role = self.user_roles.get(user)
            if role in [RoleID.ADMIN, RoleID.HQ]:
                await connection.send_json(message)

    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)

manager = ConnectionManager()

async def online_status_cleaner():
    """[物理自愈] 循环检查心跳，清理异常断开的死节点"""
    from utils.redis_utils import redis_mgr
    while True:
        try:
            client = await redis_mgr.connect()
            if client:
                online_set = await client.smembers("online_agents_set")
                for username in online_set:
                    # 检查心跳 Key 是否还存在
                    has_heartbeat = await client.exists(f"agent_heartbeat:{username}")
                    if not has_heartbeat:
                        await redis_mgr.mark_offline(username)
                        await manager.broadcast({"type": "TACTICAL_NODE_SYNC", "username": username, "status": "OFFLINE"})
                        logger.info(f"🧹 [自愈] 已清理僵尸节点: {username}")
        except Exception as e:
            logger.error(f"⚠️ [自愈循环异常]: {e}")
        await asyncio.sleep(45) # 每 45 秒扫描一次 (心跳 TTL 是 60s)

# --- 3. FastAPI 应用配置 ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 初始化 Redis
    from utils.redis_utils import redis_mgr
    client = await redis_mgr.connect()
    if client:
        app.state.redis = client
        logger.info("✅ Redis 战术缓存已激活")
        # 启动自愈清洗任务
        asyncio.create_task(online_status_cleaner())
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

# --- 物理资产托管：Web 态势舱支持 ---
# 自动检测并托管前端静态资源
dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist", "renderer")
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")
    logger.info(f"🌐 [Web链路] 已激活前端托管: {dist_path}")
else:
    logger.warning(f"⚠️ [Web链路] 未发现 dist 目录，请先执行 npm run build")

# --- 4. WebSocket 战术链路 ---
@app.websocket("/api/ws/risk")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...), username: str = Query(...)):
    # 鉴权并提取角色
    from api.auth import get_current_user
    try:
        # 模拟 Request 对象以复用鉴权逻辑
        class MockRequest:
            def __init__(self, app): self.app = app
        
        # 关键修正：传入实例而非类，并确保 credentials 属性可访问
        class MockCreds:
            def __init__(self, t): self.credentials = t
            
        user_info = await get_current_user(MockRequest(app), MockCreds(token))
        role = user_info.get("role_id", RoleID.AGENT)
        
        # 校验令牌中的用户名与请求用户名是否一致，防止非法劫持链路
        if user_info.get("username") != username:
            logger.error(f"🚨 [WS 拒绝] 用户名不匹配: Token({user_info.get('username')}) vs Query({username})")
            await websocket.close(code=1008)
            return
        
        logger.info(f"✅ [WS 鉴权成功] 操作员 {username} 已建立物理链路")

    except Exception as e:
        logger.error(f"🚨 [WS 拒绝] 鉴权失败: {e}")
        await websocket.close(code=1008)
        return

    await manager.connect(username, websocket, role=role)
    from utils.redis_utils import redis_mgr
    await redis_mgr.mark_online(username)
    await manager.broadcast({"type": "TACTICAL_NODE_SYNC", "username": username, "status": "ONLINE"})
    
    try:
        while True:
            # 战术心跳：由前端定时发送 SCREEN_SYNC 或其他消息维持
            data = await websocket.receive_text()
            # 每次收到消息都刷新心跳 TTL
            await redis_mgr.mark_online(username)
            
            msg = json.loads(data)
            if msg.get("type") == "CHAT_TRANSMISSION":
                # 战术加固：实时扫描内容敏感词
                from core.services import SmartScanner, grant_user_reward
                scanner = SmartScanner()
                content = msg.get("content", "")
                
                # 1. 执行扫描并检查是否命中
                is_violated = await scanner.process(content, username=username, redis_client=app.state.redis, ws_manager=manager)
                
                # 2. 自愈机制：如果本次无违规，增加净空计数
                if not is_violated and app.state.redis:
                    counter_key = f"clean_msg_count:{username}"
                    count = await app.state.redis.incr(counter_key)
                    if count >= 50:
                        # 达到阈值，触发自愈奖励 (+1 PT)
                        from core.models import User
                        u_obj = await User.get_or_none(username=username)
                        if u_obj:
                            await grant_user_reward(u_obj.id, 'SCORE', '净空自愈奖励', 1, ws_manager=manager)
                            await app.state.redis.set(counter_key, 0) # 重置计数
                            logger.info(f"🌿 [自愈] 操作员 {username} 已完成 50 条净空对话，奖励 1 PT")
                elif is_violated and app.state.redis:
                    # 如果违规，重置净空计数
                    await app.state.redis.set(f"clean_msg_count:{username}", 0)

                await manager.broadcast({
                    "type": "LIVE_CHAT",
                    "username": username,
                    "content": content,
                    "target": msg.get("target")
                })
            elif msg.get("type") == "SCREEN_SYNC":
                # 物理隔离：仅向指挥中心同步画面
                await manager.broadcast_to_command({
                    "type": "SCREEN_SYNC",
                    "username": username,
                    "payload": msg.get("payload")
                })
            elif msg.get("type") == "EMERGENCY_HELP":
                # 物理隔离：仅向指挥中心推送求助信号
                await manager.broadcast_to_command({
                    "type": "EMERGENCY_HELP",
                    "username": username,
                    "content": msg.get("content"),
                    "image": msg.get("image"),
                    "subType": msg.get("subType")
                })
    except WebSocketDisconnect:
        manager.disconnect(username)
        from utils.redis_utils import redis_mgr
        await redis_mgr.mark_offline(username)
        await manager.broadcast({"type": "TACTICAL_NODE_SYNC", "username": username, "status": "OFFLINE"})
    except Exception as e:
        logger.error(f"⚠️ WS 链路异常: {e}")
        manager.disconnect(username)
        from utils.redis_utils import redis_mgr
        await redis_mgr.mark_offline(username)
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
