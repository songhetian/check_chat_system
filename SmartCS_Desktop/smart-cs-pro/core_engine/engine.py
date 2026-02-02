import json, time, asyncio, re, sqlite3, hashlib, secrets, os, logging
from collections import deque
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn, threading, httpx, numpy as np, pymysql
from PIL import ImageGrab
from dotenv import load_dotenv

# --- 1. 初始化 ---
load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def get_db_conn():
    return pymysql.connect(host=os.getenv("DB_HOST"), user=os.getenv("DB_USER"), password=os.getenv("DB_PASSWORD"), database=os.getenv("DB_NAME"), cursorclass=pymysql.cursors.DictCursor)

# --- 2. 核心画像与积分逻辑 ---
class PersonaEngine:
    def __init__(self):
        self.db_path = "customers.db"
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("CREATE TABLE IF NOT EXISTS customers (name TEXT PRIMARY KEY, level TEXT, ltv REAL, frequency INTEGER)")

    async def increment_agent_volume(self, username):
        """[实战积分] 每成功识别一个客户并处理，增加坐席实战量"""
        try:
            conn = get_db_conn()
            with conn.cursor() as cursor:
                cursor.execute("UPDATE users SET handled_customers_count = handled_customers_count + 1 WHERE username = %s", (username,))
            conn.commit(); conn.close()
        except: pass

    def get_persona(self, raw_name):
        name = re.sub(r'\(.*?\)|\[.*?\]', '', raw_name).strip()
        if len(name) < 2: return None
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor(); cursor.execute("SELECT * FROM customers WHERE name=?", (name,))
            row = cursor.fetchone()
            if row: return {"name": row[0], "level": row[1], "ltv": row[2], "frequency": row[3]}
            else: return {"name": name, "level": "NEW", "ltv": 0, "frequency": 1}

persona_engine = PersonaEngine()

# --- 3. 扫描器 ---
class SmartScanner:
    def __init__(self):
        self.ocr = None; self.last_customer = ""; self.last_hash = ""
        self.regions = {"name_area": (450, 50, 800, 100)}

    def scan_screen(self):
        try:
            full_img = ImageGrab.grab(); roi = full_img.crop(self.regions["name_area"])
            h = hashlib.md5(roi.tobytes()).hexdigest()
            if h == self.last_hash: return
            self.last_hash = h
            
            if self.ocr is None:
                from paddleocr import PaddleOCR
                self.ocr = PaddleOCR(use_angle_cls=True, lang="ch", show_log=False)
            
            res = self.ocr.ocr(np.array(roi), cls=True)
            if res and res[0]:
                raw_name = res[0][0][1][0]
                data = persona_engine.get_persona(raw_name)
                if data and data["name"] != self.last_customer:
                    self.last_customer = data["name"]
                    # 触发实战积分增加
                    asyncio.run_coroutine_threadsafe(persona_engine.increment_agent_volume("admin"), main_loop)
                    asyncio.run_coroutine_threadsafe(broadcast_event({"type": "trigger-customer", "detail": data}), main_loop)
        except: pass

scanner = SmartScanner()

# --- 4. 实时总线 ---
active_connections = []
async def broadcast_event(data):
    for conn in active_connections:
        try: await conn.send_text(json.dumps(data))
        except: pass

@app.websocket("/ws/risk")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept(); active_connections.append(websocket)
    try:
        while True: await websocket.receive_text()
    except: active_connections.remove(websocket)

if __name__ == "__main__":
    main_loop = asyncio.new_event_loop()
    threading.Thread(target=lambda: uvicorn.run(app, host="0.0.0.0", port=8000), daemon=True).start()
    while True: scanner.scan_screen(); time.sleep(3)
