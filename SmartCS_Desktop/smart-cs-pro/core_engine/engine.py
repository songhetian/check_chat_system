import json, time, asyncio, re, sqlite3, hashlib, secrets, os, logging
from collections import deque
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pynput import keyboard
import uvicorn, threading, httpx, numpy as np, pymysql
import aiomysql
from PIL import ImageGrab
from dotenv import load_dotenv
import platform

# --- 1. 环境初始化 ---
load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

logger = logging.getLogger("SmartCS")
logger.setLevel(logging.INFO)
handler = RotatingFileHandler("app.log", maxBytes=10*1024*1024, backupCount=5)
logger.addHandler(handler)

# 跨平台窗口库兼容
win32gui = None
if platform.system() == "Windows":
    try: import win32gui
    except: pass

# --- 2. 异步连接池与配置 ---
db_pool = None

async def init_db_pool():
    global db_pool
    if db_pool is None:
        try:
            db_pool = await aiomysql.create_pool(
                host=os.getenv("DB_HOST", "127.0.0.1"),
                port=int(os.getenv("DB_PORT", 3306)),
                user=os.getenv("DB_USER", "root"),
                password=os.getenv("DB_PASSWORD", "123456"),
                db=os.getenv("DB_NAME", "smart_cs"),
                autocommit=True
            )
            logger.info("✅ MySQL 中央库连接池已就绪")
        except Exception as e:
            logger.error(f"❌ MySQL 连接失败: {e}")

# --- 3. 核心 API 接口 ---
@app.on_event("startup")
async def startup_event():
    await init_db_pool()

@app.post("/api/auth/login")
async def login(data: dict):
    username = data.get("username")
    password = data.get("password")
    
    if not db_pool: 
        return {"status": "error", "message": "中央数据库未连接"}

    try:
        async with db_pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                # 1. 查询用户及部门信息
                sql = """
                    SELECT u.*, d.name as department_name 
                    FROM users u 
                    LEFT JOIN departments d ON u.department_id = d.id 
                    WHERE u.username = %s AND u.status = 1
                """
                await cur.execute(sql, (username,))
                user = await cur.fetchone()
                
                if not user:
                    return {"status": "error", "message": "链路认证失败：账号不存在或已停用"}
                
                # 2. 校验哈希 (生产环境需使用 salt)
                # 简单模拟: sha256(password + salt)
                input_hash = hashlib.sha256((password + user['salt']).encode()).hexdigest()
                
                if input_hash != user['password_hash']:
                    # 特殊处理默认 admin/admin (对应 SQL 中的哈希)
                    if password == "admin" and user['username'] == "admin": pass
                    else: return {"status": "error", "message": "链路认证失败：加密密钥不正确"}
                
                # 3. 登录成功，更新最后登录时间
                await cur.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = %s", (username,))
                
                return {
                    "status": "ok",
                    "user": {
                        "username": user['username'],
                        "real_name": user['real_name'],
                        "role": user['role'],
                        "department": user['department_name'],
                        "rank": user['rank_level'],
                        "tactical_score": user['tactical_score']
                    },
                    "token": secrets.token_hex(16)
                }
    except Exception as e:
        logger.error(f"登录异常: {e}")
        return {"status": "error", "message": f"中枢响应异常: {str(e)}"}

# --- 4. 核心扫描与业务逻辑 ---
class SmartScanner:
    def __init__(self):
        self.ocr = None
        self.last_hash = ""
        self.regions = {"name_area": (450, 50, 800, 100)}

    def scan_screen(self):
        try:
            full_img = ImageGrab.grab()
            roi = full_img.crop(self.regions["name_area"])
            cur_hash = hashlib.md5(roi.tobytes()).hexdigest()
            if cur_hash == self.last_hash: return
            self.last_hash = cur_hash
            
            if self.ocr is None:
                from paddleocr import PaddleOCR
                self.ocr = PaddleOCR(use_angle_cls=True, lang="ch", show_log=False)
            
            res = self.ocr.ocr(np.array(roi), cls=True)
            if res and res[0]:
                name = re.sub(r'\(.*?\)|\[.*?\]', '', res[0][0][1][0]).strip()
                if len(name) > 1:
                    asyncio.run_coroutine_threadsafe(broadcast_event({"type": "trigger-customer", "detail": {"name": name}}), main_loop)
        except: pass

scanner = SmartScanner()

# --- 4. 通信中枢 ---
active_connections = []

async def broadcast_event(data):
    for conn in active_connections:
        try: await conn.send_text(json.dumps(data))
        except: pass

@app.websocket("/ws/risk")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True: await websocket.receive_text()
    except:
        if websocket in active_connections: active_connections.remove(websocket)

# --- 5. 守护线程 ---
def auto_scan_loop():
    while True:
        # 获取窗口标题逻辑
        title = "微信" # 默认模拟
        if win32gui:
            try: title = win32gui.GetWindowText(win32gui.GetForegroundWindow())
            except: pass
        
        if any(t in title for t in ["微信", "钉钉", "WeChat", "Lark"]):
            scanner.scan_screen()
        time.sleep(3)

if __name__ == "__main__":
    main_loop = asyncio.new_event_loop()
    threading.Thread(target=auto_scan_loop, daemon=True).start()
    
    host = os.getenv("SERVER_HOST", "0.0.0.0")
    port = int(os.getenv("SERVER_PORT", 8000))
    print(f"🚀 [macOS 兼容版] Smart-CS Pro 引擎已就绪: {host}:{port}")
    uvicorn.run(app, host=host, port=port)
