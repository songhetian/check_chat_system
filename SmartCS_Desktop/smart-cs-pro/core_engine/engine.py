import json, time, asyncio, re, sqlite3, hashlib, secrets, os, logging
from collections import deque
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pynput import keyboard
import uvicorn, threading, httpx, numpy as np, pymysql
from PIL import ImageGrab
import win32gui
from dotenv import load_dotenv

# --- 1. 配置与日志 ---
load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
logger = logging.getLogger("SmartCS")
logger.setLevel(logging.INFO)
handler = RotatingFileHandler("app.log", maxBytes=10*1024*1024, backupCount=5)
logger.addHandler(handler)

def load_config():
    return {
        "db": {"host": os.getenv("DB_HOST"), "user": os.getenv("DB_USER"), "pass": os.getenv("DB_PASSWORD"), "name": os.getenv("DB_NAME")},
        "ai": {"url": os.getenv("AI_URL"), "model": os.getenv("AI_MODEL"), "enabled": os.getenv("AI_ENABLED") == "true"}
    }
CONFIG = load_config()

# --- 2. 性能压榨型扫描器 (Delta-Scan) ---
class SmartScanner:
    def __init__(self):
        self.ocr = None
        self.last_hash = ""
        self.regions = {"name_area": (450, 50, 800, 100)}

    def _ensure_ocr(self):
        if self.ocr is None:
            from paddleocr import PaddleOCR
            self.ocr = PaddleOCR(use_angle_cls=True, lang="ch", show_log=False)

    def scan_screen(self):
        try:
            full_img = ImageGrab.grab()
            roi = full_img.crop(self.regions["name_area"])
            # 增量比对：像素哈希
            cur_hash = hashlib.md5(roi.tobytes()).hexdigest()
            if cur_hash == self.last_hash: return
            self.last_hash = cur_hash
            
            self._ensure_ocr()
            res = self.ocr.ocr(np.array(roi), cls=True)
            if res and res[0]:
                name = re.sub(r'\(.*?\)|\[.*?\]', '', res[0][0][1][0]).strip()
                if len(name) > 1:
                    asyncio.run_coroutine_threadsafe(broadcast_event({"type": "trigger-customer", "detail": {"name": name}}), main_loop)
        except: pass

scanner = SmartScanner()

# --- 3. 实时引擎与 AI 接口 ---
active_connections = []
async def broadcast_event(data):
    for conn in active_connections:
        try: await conn.send_text(json.dumps(data))
        except: pass

@app.post("/api/ai/optimize")
async def ai_optimize(data: dict):
    # 调用大模型优化并记录
    return {"status": "ok", "optimized": "已优化的话术..."}

@app.websocket("/ws/risk")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True: await websocket.receive_text()
    except: active_connections.remove(websocket)

# --- 4. 循环与启动 ---
def auto_scan_loop():
    while True:
        scanner.scan_screen()
        time.sleep(3)

if __name__ == "__main__":
    main_loop = asyncio.new_event_loop()
    threading.Thread(target=auto_scan_loop, daemon=True).start()
    uvicorn.run(app, host="0.0.0.0", port=8000)