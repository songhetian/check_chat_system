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

async def get_db_pool():
    global db_pool
    if db_pool is None:
        db_pool = await aiomysql.create_pool(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            db=os.getenv("DB_NAME"),
            autocommit=True
        )
    return db_pool

# --- 3. 核心扫描与业务逻辑 ---
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
