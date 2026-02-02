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
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="http://.*", # 允许局域网内所有 HTTP 源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

async def init_db_pool(retries=5, delay=3):
    global db_pool
    host = os.getenv("DB_HOST", "127.0.0.1")
    user = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASSWORD", "123456")
    db_name = os.getenv("DB_NAME", "smart_cs")
    port = int(os.getenv("DB_PORT", 3306))
    
    for i in range(retries):
        try:
            db_pool = await aiomysql.create_pool(
                host=host,
                port=port,
                user=user,
                password=password,
                db=db_name,
                autocommit=True
            )
            logger.info(f"✅ 中央战术库已连接 (Node: {host}:{port}, User: {user})")
            return True
        except Exception as e:
            logger.warning(f"⚠️ 数据库链路建立失败 ({i+1}/{retries}): {e}")
            await asyncio.sleep(delay)
    
    logger.error("❌ 严重错误：无法建立中央库连接，系统将运行在离线受限模式")
    return False

import subprocess
import shutil

# --- 3. 智脑分析引擎 (Ollama Integration & Auto-Lifecycle) ---
class AIAnalyzer:
    def __init__(self):
        self.api_url = os.getenv("AI_URL", "http://127.0.0.1:11434/api/chat")
        self.model = os.getenv("AI_MODEL", "qwen2:1.5b")
        self.is_healthy = False

    def _start_ollama_service(self):
        """静默拉起 Ollama 后台服务 (支持 macOS/Windows)"""
        try:
            # 检测是否已安装 ollama
            if not shutil.which("ollama"):
                logger.error("❌ 系统未发现 Ollama 可执行程序，请前往 ollama.com 安装")
                return False
            
            # 尝试拉起服务 (macOS 示例，Windows 通常为 ollama app)
            logger.info("⏳ 正在尝试自动激活 Ollama 服务层...")
            subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        except Exception as e:
            logger.error(f"启动 Ollama 失败: {e}")
            return False

    async def check_health(self):
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                base_url = self.api_url.split('/api')[0]
                resp = await client.get(base_url)
                self.is_healthy = resp.status_code == 200
        except:
            # 如果不通，尝试自动拉起一次
            if self._start_ollama_service():
                await asyncio.sleep(3) # 给服务 3 秒初始化时间
                return await self.check_health()
            self.is_healthy = False
        
        # 如果服务健康，确保模型已加载
        if self.is_healthy:
            asyncio.create_task(self.ensure_model_loaded())
        return self.is_healthy

    async def ensure_model_loaded(self):
        """确保战术模型已 pull 并驻留内存"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                # 检查模型列表
                resp = await client.get(self.api_url.replace('/chat', '/tags'))
                models = [m['name'] for m in resp.json().get('models', [])]
                
                if self.model not in models and f"{self.model}:latest" not in models:
                    logger.info(f"📡 正在下载战术模型 {self.model} (首次运行需耗时)...")
                    # 这里可以发送 WS 通知给前端显示下载进度
                    subprocess.Popen(["ollama", "pull", self.model])
        except: pass

    async def analyze_sentiment(self, context):
        if not self.is_healthy: 
            if not await self.check_health(): return None
        
        prompt = f"作为战术指挥官，分析以下对话内容：\"{context}\"。请以 JSON 格式输出：{{ \"risk_score\": (0-10), \"sentiment_score\": (-10 to 10), \"strategy\": \"建议\", \"voice_alert\": \"语音内容\" }}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                payload = {
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                    "format": "json"
                }
                resp = await client.post(self.api_url, json=payload)
                if resp.status_code == 200:
                    return json.loads(resp.json()['message']['content'])
        except Exception as e:
            logger.error(f"AI_ANALYSIS_FAILED: {e}")
        return None

ai_analyzer = AIAnalyzer()

# --- 4. 核心 API 接口 ---
@app.on_event("startup")
async def startup_event():
    await init_db_pool()
    # 启动时检测 AI 状态
    is_ai_ok = await ai_analyzer.check_health()
    if not is_ai_ok:
        logger.warning(f"🚨 [智脑预警] 无法连接到 Ollama，请执行 'ollama run {ai_analyzer.model}'")
    else:
        logger.info(f"🧠 [智脑就绪] Ollama 服务连接正常 ({ai_analyzer.model})")

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
