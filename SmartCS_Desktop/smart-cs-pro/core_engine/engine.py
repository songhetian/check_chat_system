import json, time, asyncio, re, sqlite3, hashlib, secrets, os, logging
from collections import deque
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn, threading, httpx, numpy as np, pymysql
from PIL import ImageGrab
from dotenv import load_dotenv
from pymysqlpool.pool import Pool # 需要在 init_system 中增加

# --- 1. 核心配置与池化 ---
load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# MySQL 连接池配置 (解决高并发)
pool = Pool(host=os.getenv("DB_HOST"), user=os.getenv("DB_USER"), password=os.getenv("DB_PASSWORD"), db=os.getenv("DB_NAME"), autocommit=True)
pool.init()

# --- 2. 链路管理器 (解决消息误投送) ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {} # {username: socket}

    async def connect(self, username: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[username] = websocket
        logging.info(f"🔗 坐席已挂载: {username}")

    def disconnect(self, username: str):
        if username in self.active_connections:
            del self.active_connections[username]

    async def send_to_user(self, username: str, data: dict):
        """精准投送指令"""
        if username in self.active_connections:
            try: await self.active_connections[username].send_text(json.dumps(data))
            except: self.disconnect(username)

    async def broadcast(self, data: dict):
        """全网广播 (如全局策略)"""
        for user in list(self.active_connections.keys()):
            await self.send_to_user(user, data)

manager = ConnectionManager()

# --- 3. AI 超脑逻辑 (保持之前的进化版) ---
SYSTEM_PROMPT = "你是一个顶级数智战术指挥专家..." # 省略详细 Prompt 保持简洁

# --- 4. 业务 API 重构 ---
@app.websocket("/ws/risk")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None), username: str = Query(None)):
    # 鉴权逻辑 (真实 JWT 预留)
    if not token or not username:
        await websocket.close(code=4003)
        return
    
    await manager.connect(username, websocket)
    try:
        while True:
            msg = await websocket.receive_text()
            data = json.loads(msg)
            # 处理坐席反馈
            if data.get("type") == "MUTE_ACK":
                logging.info(f"坐席 {username} 已执行静音指令")
    except WebSocketDisconnect:
        manager.disconnect(username)

# --- 5. 扫描器闭环优化 (增加语音包注入) ---
async def handle_violation(username, keyword, level, context):
    # 1. 匹配语音协议
    voice_text = ""
    if level >= 8: voice_text = "特级警报，违规证据已实时上报。"
    elif level >= 5: voice_text = "操作提醒，请注意话术合规。"
    
    payload = {
        "type": "VIOLATION",
        "keyword": keyword,
        "level": level,
        "context": context,
        "voice_alert": voice_text, # 注入语音文本
        "timestamp": time.time()
    }
    
    # 2. 精准推送给对应坐席
    await manager.send_to_user(username, payload)
    
    # 3. 总部同步 (通过 manager.broadcast 发送给所有 HQ 端和大屏)
    await manager.broadcast({"type": "GLOBAL_MONITOR_UPDATE", "detail": payload})

# --- 6. 启动 ---
if __name__ == "__main__":
    host = os.getenv("SERVER_HOST", "0.0.0.0")
    port = int(os.getenv("SERVER_PORT", 8000))
    uvicorn.run(app, host=host, port=port)