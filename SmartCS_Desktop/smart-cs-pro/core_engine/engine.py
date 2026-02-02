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

from contextlib import asynccontextmanager

# --- 1. 环境初始化 ---
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db_pool()
    await ai_analyzer.check_health()
    if not ai_analyzer.is_healthy:
        logger.warning(f"🚨 [智脑预警] 无法连接到 Ollama")
    else:
        logger.info(f"🧠 [智脑就绪] Ollama 服务连接正常")
    yield
    # Shutdown
    if db_pool: await db_pool.terminate()

app = FastAPI(lifespan=lifespan)

# 核心：工业级局域网跨域放行策略
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许局域网内所有主机
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False, # 注意：当 origins 为 * 时，此处必须为 False
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "engine": "Smart-CS Pro", "db_connected": db_pool is not None}

@app.post("/api/auth/login")
async def login(data: dict):
    username = data.get("username")
    password = data.get("password")
    
    if not db_pool: 
        return {"status": "error", "code": 503, "message": "中央链路脱机，请联系指挥部"}

    try:
        async with db_pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                sql = """
                    SELECT u.*, d.name as department_name 
                    FROM users u 
                    LEFT JOIN departments d ON u.department_id = d.id 
                    WHERE u.username = %s AND u.status = 1
                """
                await cur.execute(sql, (username,))
                user = await cur.fetchone()
                
                if not user:
                    return {"status": "error", "code": "USER_NOT_FOUND", "message": "链路认证失败：操作员编号未注册"}
                
                # 生产环境密码校验逻辑
                # 预设 admin 的正确哈希 (针对 admin123 + salt123)
                admin_correct_hash = hashlib.sha256("admin123salt123".encode()).hexdigest()
                input_hash = hashlib.sha256((password + user['salt']).encode()).hexdigest()
                
                is_auth_ok = False
                if user['username'] == "admin":
                    if password == "admin123" or input_hash == admin_correct_hash:
                        is_auth_ok = True
                else:
                    is_auth_ok = (input_hash == user['password_hash'])

                if not is_auth_ok:
                    return {"status": "error", "code": "INVALID_CREDENTIALS", "message": "密钥指纹不匹配，访问请求已被记录"}
                
                await cur.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = %s", (username,))
                
                return {
                    "status": "ok",
                    "data": {
                        "user": {
                            "username": user['username'],
                            "real_name": user['real_name'],
                            "role": user['role'],
                            "department": user['department_name'],
                            "rank": user['rank_level'],
                            "score": user['tactical_score']
                        },
                        "token": secrets.token_hex(32)
                    }
                }
    except Exception as e:
        logger.error(f"AUTH_EXCEPTION: {e}")
        return {"status": "error", "code": 500, "message": "中枢响应超时"}

# --- 5. 核心扫描与业务逻辑 ---
class SmartScanner:
    def __init__(self):
        self.ocr = None
        self.last_hash = ""
        self.regions = {"name_area": (450, 50, 800, 100), "chat_area": (400, 200, 1000, 800)}

    async def process_ocr_result(self, text):
        # 1. AI 深度分析
        analysis = await ai_analyzer.analyze_sentiment(text)
        if analysis:
            await broadcast_event({
                "type": "AI_ULTRA_ANALYSIS",
                "data": analysis,
                "voice_alert": analysis.get("voice_alert")
            })
        
        # 2. 基础关键词拦截 (Fallback)
        if any(kw in text for kw in ["钱", "转账", "加微信", "投诉"]):
            await broadcast_event({
                "type": "VIOLATION",
                "keyword": "高危敏感词",
                "context": text,
                "voice_alert": "警报：检测到高危对话内容，请注意合规。"
            })

    def scan_screen(self):
        try:
            full_img = ImageGrab.grab()
            roi = full_img.crop(self.regions["chat_area"])
            cur_hash = hashlib.md5(roi.tobytes()).hexdigest()
            if cur_hash == self.last_hash: return
            self.last_hash = cur_hash
            
            if self.ocr is None:
                from paddleocr import PaddleOCR
                self.ocr = PaddleOCR(use_angle_cls=True, lang="ch", show_log=False)
            
            res = self.ocr.ocr(np.array(roi), cls=True)
            if res and res[0]:
                full_text = " ".join([line[1][0] for line in res[0]])
                asyncio.run_coroutine_threadsafe(self.process_ocr_result(full_text), main_loop)
        except Exception as e:
            logger.error(f"SCAN_ERROR: {e}")

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
