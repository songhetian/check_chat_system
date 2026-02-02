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

# --- 1. 初始化配置 ---
load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
logger = logging.getLogger("SmartCS")
logger.setLevel(logging.INFO)
handler = RotatingFileHandler("app.log", maxBytes=10*1024*1024, backupCount=5)
logger.addHandler(handler)

def get_db_conn():
    return pymysql.connect(
        host=os.getenv("DB_HOST"), 
        user=os.getenv("DB_USER"), 
        password=os.getenv("DB_PASSWORD"), 
        database=os.getenv("DB_NAME"), 
        cursorclass=pymysql.cursors.DictCursor
    )

# --- 2. 战术风险引擎 (数据驱动分级) ---
class RiskEngine:
    def __init__(self):
        self.sensitive_config = {} # {word: level}
        self.char_buffer = deque(maxlen=50)
        self.active_connections = []
        self.sync_rules()

    def sync_words(self):
        """从 MySQL 同步词库与等级"""
        try:
            conn = get_db_conn()
            with conn.cursor() as cursor:
                cursor.execute("SELECT word, risk_level FROM sensitive_words WHERE is_active=1")
                rows = cursor.fetchall()
                self.sensitive_config = {r['word']: r['risk_level'] for r in rows}
            conn.close()
        except: self.sensitive_config = {"报警": 9, "投诉": 8, "转账": 7}

    def add_char(self, char):
        self.char_buffer.append(char)
        return self.check_text()

    def check_text(self):
        text = "".join(self.char_buffer)
        for word, level in self.sensitive_config.items():
            if word in text:
                return {"type": "VIOLATION", "keyword": word, "level": level, "context": text}
        return None

risk_engine = RiskEngine()

# --- 3. 扫描与通信 ---
class SmartScanner:
    def __init__(self):
        self.ocr = None; self.last_hash = ""; self.regions = {"name_area": (450, 50, 800, 100)}
    def _ensure_ocr(self):
        if self.ocr is None:
            from paddleocr import PaddleOCR
            self.ocr = PaddleOCR(use_angle_cls=True, lang="ch", show_log=False)
    def scan_screen(self):
        try:
            full_img = ImageGrab.grab(); roi = full_img.crop(self.regions["name_area"])
            h = hashlib.md5(roi.tobytes()).hexdigest()
            if h == self.last_hash: return
            self.last_hash = h
            asyncio.run_coroutine_threadsafe(broadcast_event({"type": "SCAN_HEARTBEAT"}), main_loop)
            self._ensure_ocr()
            res = self.ocr.ocr(np.array(roi), cls=True)
            if res and res[0]:
                name = re.sub(r'\(.*?\)|\[.*?\]', '', res[0][0][1][0]).strip()
                if len(name) > 1: asyncio.run_coroutine_threadsafe(broadcast_event({"type": "trigger-customer", "detail": {"name": name}}), main_loop)
        except: pass

scanner = SmartScanner()

class VoiceManager:
    def __init__(self):
        self.protocols = [] # [{"min": 8, "max": 10, "text": "..."}]
        self.sync_protocols()

    def sync_protocols(self):
        try:
            conn = get_db_conn()
            with conn.cursor() as cursor:
                cursor.execute("SELECT min_level, max_level, voice_text FROM voice_protocols WHERE is_active=1")
                rows = cursor.fetchall()
                self.protocols = rows
            conn.close()
        except: pass

    def get_text_for_level(self, level):
        for p in self.protocols:
            if p['min_level'] <= level <= p['max_level']:
                return p['voice_text']
        return None

voice_manager = VoiceManager()

async def broadcast_event(data):
    if data.get("type") == "VIOLATION":
        # 核心：根据风险等级动态匹配语音模板
        voice_text = voice_manager.get_text_for_level(data.get("level", 0))
        if voice_text:
            data["voice_alert"] = voice_text
    
    for conn in risk_engine.active_connections:
        try: await conn.send_text(json.dumps(data))
        except: pass

@app.websocket("/ws/risk")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    risk_engine.active_connections.append(websocket)
    try:
        while True: await websocket.receive_text()
    except: risk_engine.active_connections.remove(websocket)

# --- 4. 循环任务 ---
def keyboard_hook():
    def on_press(key):
        if hasattr(key, 'char'):
            res = risk_engine.add_char(key.char)
            if res: asyncio.run_coroutine_threadsafe(broadcast_event(res), main_loop)
    with keyboard.Listener(on_press=on_press) as l: l.join()

def auto_scan_loop():
    while True: scanner.scan_screen(); time.sleep(3)

if __name__ == "__main__":
    main_loop = asyncio.new_event_loop()
    threading.Thread(target=keyboard_hook, daemon=True).start()
    threading.Thread(target=auto_scan_loop, daemon=True).start()
    uvicorn.run(app, host="0.0.0.0", port=8000)
