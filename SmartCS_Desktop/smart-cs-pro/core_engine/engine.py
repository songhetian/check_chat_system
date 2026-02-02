import json, time, asyncio, re, hashlib, secrets, os, logging, subprocess, shutil, platform
from contextlib import asynccontextmanager
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn, threading, httpx, numpy as np, aiomysql
from PIL import ImageGrab
from dotenv import load_dotenv

# --- 1. 环境初始化 ---
load_dotenv()

logger = logging.getLogger("SmartCS")
logger.setLevel(logging.INFO)
handler = RotatingFileHandler("app.log", maxBytes=10*1024*1024, backupCount=5)
logger.addHandler(handler)

# --- 2. 数据库连接池 ---
db_pool = None

async def init_db_pool(retries=3):
    global db_pool
    try:
        db_pool = await aiomysql.create_pool(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", "123456"),
            db=os.getenv("DB_NAME", "smart_cs"),
            autocommit=True
        )
        logger.info("✅ 中央数据库已连接")
    except Exception as e:
        logger.error(f"❌ 数据库连接失败: {e}")

# --- 3. 智脑分析引擎 ---
class AIAnalyzer:
    def __init__(self):
        self.api_url = os.getenv("AI_URL", "http://127.0.0.1:11434/api/chat")
        self.model = os.getenv("AI_MODEL", "qwen2:1.5b")
        self.is_healthy = False

    async def check_health(self):
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                base_url = self.api_url.split('/api')[0]
                resp = await client.get(base_url)
                self.is_healthy = resp.status_code == 200
        except: self.is_healthy = False
        return self.is_healthy

    async def analyze_sentiment(self, context):
        if not self.is_healthy: return None
        prompt = f"作为战术指挥官，分析对话内容：\"{context}\"，以JSON输出：{{ \"risk_score\": 0-10, \"strategy\": \"建议\" }}"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                payload = { "model": self.model, "messages": [{"role": "user", "content": prompt}], "stream": False, "format": "json" }
                resp = await client.post(self.api_url, json=payload)
                return json.loads(resp.json()['message']['content'])
        except: return None

ai_analyzer = AIAnalyzer()

# --- 4. 扫描引擎 ---
class SmartScanner:
    def __init__(self):
        self.ocr = None
        self.regions = {"chat_area": (400, 200, 1000, 800)}

    async def get_ocr(self):
        if not self.ocr:
            from paddleocr import PaddleOCR
            self.ocr = PaddleOCR(use_angle_cls=False, lang="ch", show_log=False)
        return self.ocr

    async def process(self, text):
        analysis = await ai_analyzer.analyze_sentiment(text)
        if analysis:
            await broadcast_event({"type": "AI_ULTRA_ANALYSIS", "data": analysis})
        if any(k in text for k in ["钱", "转账"]):
            await broadcast_event({"type": "VIOLATION", "keyword": "财务", "context": text})

    def scan(self):
        pass

scanner = SmartScanner()

# --- 5. FastAPI 应用 ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(init_db_pool())
    asyncio.create_task(ai_analyzer.check_health())
    yield
    if db_pool: db_pool.close(); await db_pool.wait_closed()

app = FastAPI(lifespan=lifespan)

# 极致跨域：手动拦截处理
@app.middleware("http")
async def cors_handler(request: Request, call_next):
    if request.method == "OPTIONS":
        response = JSONResponse(content="OK", status_code=200)
    else:
        response = await call_next(request)
    
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.get("/api/health")
async def health(): 
    return {"status": "ok", "ai_ready": ai_analyzer.is_healthy}

@app.post("/api/auth/login")
async def login(data: dict):
    u, p = data.get("username"), data.get("password")
    if not db_pool: return {"status": "error", "message": "数据库未就绪"}
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT * FROM users WHERE username = %s", (u,))
            user = await cur.fetchone()
            if not user: return {"status": "error", "message": "账号不存在"}
            # admin123 专用校验
            if u == "admin" and p == "admin123":
                return {"status": "ok", "data": {"user": {"username":u, "real_name":user['real_name'], "role":user['role'], "department": "指挥部"}, "token": "tk_admin"}}
            return {"status": "error", "message": "密码错误"}

# --- 6. 通信与启动 ---
active_conns = []
async def broadcast_event(data):
    for c in active_conns:
        try: await c.send_text(json.dumps(data))
        except: pass

@app.websocket("/ws/risk")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept(); active_conns.append(websocket)
    try:
        while True: await websocket.receive_text()
    except: active_conns.remove(websocket)

if __name__ == "__main__":
    main_loop = asyncio.new_event_loop()
    host = os.getenv("SERVER_HOST", "0.0.0.0")
    port = int(os.getenv("SERVER_PORT", 8000))
    print(f"🚀 Smart-CS Pro 引擎已就绪: {host}:{port}")
    uvicorn.run(app, host=host, port=port)
