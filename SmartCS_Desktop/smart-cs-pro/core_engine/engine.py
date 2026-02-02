import json
import time
import asyncio
import base64
import re
from collections import deque
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
import pandas as pd
import io

# ... (之前的代码保持不变)

@app.post("/api/admin/agent/praise")
async def praise_agent(agent_id: str):
    # 下发“表扬”指令，触发坐席端烟花
    await broadcast_event({
        "type": "PRAISE",
        "agent_id": agent_id,
        "message": "主管为您点赞！表现优异！"
    })
    return {"status": "ok"}

import subprocess
import os

# ... (之前的代码保持不变)

@app.post("/api/agent/convert-video")
async def convert_video(input_path: str):
    """
    使用 FFmpeg 将 MOV/AVI 等格式转换为压缩后的 MP4
    """
    if not os.path.exists(input_path):
        return {"status": "error", "message": "文件不存在"}
    
    output_path = os.path.splitext(input_path)[0] + "_converted.mp4"
    
    # 执行 FFmpeg 指令 (假设用户系统已安装 ffmpeg)
    # -y: 覆盖输出, -crf 28: 中等压缩率提升速度
    cmd = f'ffmpeg -y -i "{input_path}" -vcodec libx264 -crf 28 "{output_path}"'
    
    try:
        # 发送进度占位通知
        await broadcast_event({"type": "CONVERT_STATUS", "status": "PROCESSING"})
        
        subprocess.run(cmd, shell=True, check=True)
        
        await broadcast_event({"type": "CONVERT_STATUS", "status": "DONE", "path": output_path})
        return {"status": "ok", "output": output_path}
    except Exception as e:
        await broadcast_event({"type": "CONVERT_STATUS", "status": "ERROR"})
        return {"status": "error", "message": str(e)}

from PIL import Image, ImageDraw, ImageFont
import pypinyin

# ... (之前的代码保持不变)

@app.post("/api/agent/image-defense")
async def image_defense(input_path: str, watermark_text: str):
    """
    为图片添加安全水印并压缩，防止客户乱传
    """
    if not os.path.exists(input_path):
        return {"status": "error", "message": "文件不存在"}
    
    try:
        with Image.open(input_path) as img:
            # 转换为 RGB 模式
            img = img.convert("RGBA")
            txt = Image.new("RGBA", img.size, (255, 255, 255, 0))
            draw = ImageDraw.Draw(txt)
            
            # 设置水印文字 (简单逻辑：在中心画一个半透明文字)
            # 注意：实际生产需要指定一个支持中文字体的 .ttf 文件路径
            draw.text((10, 10), watermark_text, fill=(255, 255, 255, 80))
            
            combined = Image.alpha_composite(img, txt)
            output_path = os.path.splitext(input_path)[0] + "_safe.jpg"
            combined.convert("RGB").save(output_path, "JPEG", quality=50) # 压缩质量
            
            return {"status": "ok", "output": output_path}
    except Exception as e:
        return {"status": "error", "message": str(e)}

import httpx
from fastapi import BackgroundTasks

# ... (保持现有导入不变)

async def analyze_with_llm_async(text: str):
    """
    智能 AI 分析 (异步非阻塞模式)
    """
    if not CONFIG.get("ai_enabled", False):
        return

    async with httpx.AsyncClient() as client:
        try:
            url = CONFIG.get("ollama_url")
            payload = {
                "model": "qwen2:1.5b",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": text}
                ],
                "stream": False,
                "format": "json"
            }
            
            # 增加超时控制，防止 Ollama 响应慢拖累系统
            response = await client.post(url, json=payload, timeout=2.0)
            result = response.json()
            content = json.loads(result['message']['content'])
            
            if content.get("is_violation") or content.get("risk_score", 0) > 5:
                # 即使不是明确违规，只要分值高（不耐烦、阴阳怪气等）也触发提醒
                await broadcast_event({
                    "type": "AI_ANALYSIS",
                    "risk_score": content.get("risk_score"),
                    "reason": content.get("reason"),
                    "suggestion": content.get("suggestion"),
                    "context": text,
                    "timestamp": time.time()
                })
        except Exception as e:
            print(f"⚠️ AI 分析链路异常: {str(e)}")

# 在 check_text 逻辑中调用
# background_tasks.add_task(analyze_with_llm_async, raw_text)

# 在 check_text 匹配不到关键词时调用大模型
# threading.Thread(target=lambda: asyncio.run(analyze_with_llm(raw_text))).start()
from fastapi.middleware.cors import CORSMiddleware
from pynput import keyboard
import uvicorn
import threading
from PIL import ImageGrab
import win32gui

app = FastAPI()

# 允许本地跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 核心状态配置 ---
class RiskEngine:
    def __init__(self):
        self.sensitive_words = ["滚蛋", "转账", "加微信", "骗子"] # 实际从DB加载
        self.product_keywords = {"耳机": "SL-2024-X1", "手表": "TW-GT-05"} # 商品触发词
        self.char_buffer = deque(maxlen=30) # 滑动窗口缓冲区
        self.active_connections = []

    def normalize_text(self, text):
        # 归一化：去掉所有非中文字符，防止 “滚 蛋” 逃避
        return re.sub(r'[^\u4e00-\u9fa5]', '', text)

    def check_text(self):
        raw_text = "".join(self.char_buffer)
        clean_text = self.normalize_text(raw_text)
        
        # 1. 检查违规词 (保持高优先级)
        for word in self.sensitive_words:
            if word in clean_text:
                return {"type": "VIOLATION", "keyword": word, "context": raw_text}
        
        # 2. 检查商品意向 (多重匹配逻辑)
        matched_products = []
        for kw, pid in self.product_keywords.items():
            if kw in clean_text:
                matched_products.append({"pid": pid, "keyword": kw})
        
        if matched_products:
            # 如果命中多个，返回列表；如果只有一个，前端也可以统一处理
            return {
                "type": "PRODUCT_SUGGESTION", 
                "products": matched_products[:5], # 最多推荐前5个，防止刷屏
                "count": len(matched_products)
            }
        
        return None

engine = RiskEngine()

# --- 键盘钩子监听逻辑 ---
def on_press(key):
    try:
        if hasattr(key, 'char') and key.char:
            res = engine.add_char(key.char)
            if res:
                # 发现违规，立即触发异步推送
                asyncio.run_coroutine_threadsafe(broadcast_event(res), main_loop)
    except:
        pass

def start_keyboard_hook():
    with keyboard.Listener(on_press=on_press) as listener:
        listener.join()

# --- 精准取证截图逻辑 ---
def capture_evidence():
    try:
        # 获取当前活动窗口句柄
        hwnd = win32gui.GetForegroundWindow()
        # 这里可以加入逻辑，判断如果是微信/钉钉才截图
        img = ImageGrab.grab() # 实际可以使用 grab(bbox) 截取特定窗口
        img.thumbnail((800, 450)) # 压缩以提升传输速度
        
        import io
        buffered = io.BytesIO()
        img.save(buffered, format="JPEG", quality=60)
        return base64.b64encode(buffered.getvalue()).decode('utf-8')
    except:
        return ""

# --- WebSocket 实时推送 ---
@app.websocket("/ws/risk")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    engine.active_connections.append(websocket)
    try:
        while True:
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)
            
            # 处理前端发来的指令
            if data.get("type") == "MUTE_AGENT":
                print(f"🚨 [指令收到] 坐席 {data.get('agent_id')} 申请静音保护")
                # 这里可以扩展调用系统音量控制 API 或 IM 禁言 API
                await websocket.send_text(json.dumps({
                    "type": "MUTE_CONFIRM",
                    "status": "success",
                    "timestamp": time.time()
                }))
    except WebSocketDisconnect:
        engine.active_connections.remove(websocket)

class LogBuffer:
    def __init__(self):
        self.db_path = "buffer.db"
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS pending_logs (
                    id TEXT PRIMARY KEY,
                    data TEXT,
                    timestamp REAL
                )
            """)

    def push_to_buffer(self, log_type, data):
        """将发送失败的数据暂存"""
        log_id = str(int(time.time() * 1000))
        data["buffer_id"] = log_id
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("INSERT INTO pending_logs VALUES (?, ?, ?)", 
                         (log_id, json.dumps(data), time.time()))
        print(f"📦 数据已存入本地缓冲: {log_id}")

    async def sync_task(self):
        """后台同步任务"""
        while True:
            try:
                if engine.active_connections: # 只有在有连接时才尝试同步
                    with sqlite3.connect(self.db_path) as conn:
                        cursor = conn.cursor()
                        cursor.execute("SELECT * FROM pending_logs LIMIT 10")
                        rows = cursor.fetchall()
                        
                        for row in rows:
                            log_id, log_json, _ = row
                            # 尝试推送到当前所有活跃连接
                            await broadcast_event(json.loads(log_json))
                            # 推送成功后删除
                            conn.execute("DELETE FROM pending_logs WHERE id=?", (log_id,))
                            print(f"✨ 本地缓冲数据已完成同步: {log_id}")
            except: pass
            await asyncio.sleep(10) # 每10秒检查一次重传

log_buffer = LogBuffer()

async def broadcast_event(data):
    if data["type"] == "VIOLATION":
        # 违规时带上截图
        data["screenshot"] = f"data:image/jpeg;base64,{capture_evidence()}"
        data["timestamp"] = time.time() * 1000
        data["id"] = str(int(time.time() * 1000))
        data["agent"] = "当前坐席"
        # 触发深度取证
        video_path = forensic_recorder.trigger_capture(data["id"])
        data["video_path"] = video_path

    if not engine.active_connections:
        # 如果当前没有客户端在线，自动进入缓冲
        if data["type"] in ["VIOLATION", "RED_ALERT", "AI_ANALYSIS"]:
            log_buffer.push_to_buffer(data["type"], data)
        return

    # ... (原有发送逻辑不变)
    for conn in engine.active_connections:
        try:
            await conn.send_text(json.dumps(data))
        except:
            pass # 个别连接失败不处理，靠重连和整体缓冲保障

# ... (之前的导入保持不变)
from paddleocr import PaddleOCR
import numpy as np

class SmartScanner:
    def __init__(self):
        self.ocr = None
        self.idle_start_time = time.time()
        self.last_active_time = time.time()
        # ... (其他初始化不变)

    def _ensure_ocr(self):
        if self.ocr is None:
            print("🚀 [性能引擎] 正在按需唤醒本地 OCR 模型...")
            from paddleocr import PaddleOCR
            self.ocr = PaddleOCR(use_angle_cls=True, lang="ch", show_log=False)
        self.last_active_time = time.time()

    def _check_idle_cleanup(self):
        if self.ocr and (time.time() - self.last_active_time > 600): # 10分钟空闲
            print("💤 [性能引擎] OCR 处于长期空闲，正在释放内存...")
            del self.ocr
            self.ocr = None
            import gc
            gc.collect()

    def scan_screen(self):
        self._ensure_ocr()
        # ... (使用 self.ocr 进行扫描)
        full_img = ImageGrab.grab()
        # 识别客户名字
        name_crop = full_img.crop(self.regions["name_area"])
        name_res = self.ocr.ocr(np.array(name_crop), cls=True)
        # ... (后续 OCR 逻辑保持不变)
        self._check_idle_cleanup()
        
        if name_res and name_res[0]:
            customer_name = name_res[0][0][1][0] # 提取识别到的第一行文字
            if customer_name != self.last_customer:
                self.last_customer = customer_name
                # 触发画像弹窗
                asyncio.run_coroutine_threadsafe(
                    broadcast_event({
                        "type": "trigger-customer", 
                        "detail": self.get_customer_persona(customer_name)
                    }), 
                    main_loop
                )

        # 2. 识别聊天内容与意向 (他在说什么)
        chat_crop = full_img.crop(self.regions["chat_area"])
        chat_res = ocr.ocr(np.array(chat_crop), cls=True)
        
        if chat_res and chat_res[0]:
            # 获取最后一条消息 (通常在最下面)
            last_msg = chat_res[0][-1][1][0]
            self.analyze_intent(last_msg)

import cv2
import numpy as np

class ForensicRecorder:
    def __init__(self):
        self.fps = 10
        self.buffer_sec = 5
        self.frame_buffer = deque(maxlen=self.fps * self.buffer_sec)
        
    def capture_frame(self):
        # 优化：仅当窗口在操作时才截帧存入缓冲，进一步省电
        screen = ImageGrab.grab()
        frame = cv2.cvtColor(np.array(screen), cv2.COLOR_RGB2BGR)
        frame = cv2.resize(frame, (800, 450))
        self.frame_buffer.append(frame)

    async def save_and_upload(self, violation_id, frames_to_save):
        """
        在后台线程执行耗时的视频编码与上传
        """
        try:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            filename = f"evidence_{violation_id}.mp4"
            out = cv2.VideoWriter(filename, fourcc, self.fps, (800, 450))
            
            for f in frames_to_save:
                out.write(f)
            out.release()
            
            print(f"✅ 证据视频已生成: {filename}，准备上传服务端...")
            # 模拟上传到服务端
            # await self.upload_to_server(filename)
        except Exception as e:
            print(f"❌ 取证保存失败: {e}")

async def process_forensic_trigger(violation_id):
    # 立即锁定当前的缓冲区帧，防止被新帧覆盖
    frames_snapshot = list(forensic_recorder.frame_buffer)
    # 异步执行保存逻辑，不阻塞主流程
    asyncio.create_task(forensic_recorder.save_and_upload(violation_id, frames_snapshot))

async def broadcast_event(data):
    if data["type"] == "VIOLATION":
        # ... 截图逻辑 ...
        data["id"] = str(int(time.time() * 1000))
        # 触发异步深度取证，零延迟
        await process_forensic_trigger(data["id"])
        data["video_evidence_pending"] = True
    def __init__(self):
        self.db_path = "customers.db"
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS customers (
                name TEXT PRIMARY KEY,
                level TEXT,
                tags TEXT,
                ltv REAL,
                frequency INTEGER,
                is_risk BOOLEAN
            )
        """)
        # 预存一些模拟数据，实际由主管 Excel 导入
        conn.execute("REPLACE INTO customers VALUES ('王大锤', 'VIP', '高意向,老客户', 12500, 45, 0)")
        conn.commit()
        conn.close()

    def get_persona(self, name):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM customers WHERE name=?", (name,))
        row = cursor.fetchone()
        conn.close()

        if row:
            return {
                "name": row[0],
                "level": row[1],
                "tags": row[2].split(','),
                "ltv": f"{row[3]:,}",
                "frequency": row[4],
                "lastProducts": ["系统分析中..."],
                "isRisk": bool(row[5])
            }
        else:
            # 陌生人逻辑：自动建档
            return {
                "name": name,
                "level": "NEW",
                "tags": ["首次咨询"],
                "ltv": "0",
                "frequency": 1,
                "lastProducts": [],
                "isRisk": False
            }

persona_engine = PersonaEngine()

# --- 新增：客户消费历史 API ---
@app.get("/api/agent/customer/history")
async def get_customer_history(name: str):
    """
    获取客户的真实消费趋势数据
    """
    conn = sqlite3.connect("customers.db")
    cursor = conn.cursor()
    # 模拟从订单表查询 (实际生产中应有 orders 表)
    # 这里我们返回模拟的近6个月数据，但结构是真实的 API 驱动
    cursor.execute("SELECT ltv FROM customers WHERE name=?", (name,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return {"status": "error", "message": "未找到客户"}
    
    # 模拟波动数据
    base_ltv = row[0]
    trend = [base_ltv * 0.1, base_ltv * 0.3, base_ltv * 0.2, base_ltv * 0.5, base_ltv * 0.4, base_ltv * 0.6]
    
    return {
        "status": "ok",
        "name": name,
        "trend": [int(v) for v in trend],
        "total_ltv": base_ltv
    }

# 在 SmartScanner 识别到名字后调用
# ... customer_data = persona_engine.get_persona(customer_name)

# --- 风险等级定义 ---
RISK_LEVELS = {
    "315": "CRITICAL",
    "投诉": "HIGH",
    "起诉": "CRITICAL",
    "曝光": "CRITICAL",
    "退钱": "MEDIUM",
    "不买了": "MEDIUM",
    "贵": "LOW",
    "老客户": "LOW"
}

class SmartScanner:
    # ... (之前的初始化代码保持不变)

    def analyze_intent(self, text, customer_name):
        """
        分级分析逻辑
        """
        for word, level in RISK_LEVELS.items():
            if word in text:
                if level == "CRITICAL":
                    # 1. 触发最高级别红色报警
                    asyncio.run_coroutine_threadsafe(
                        broadcast_event({
                            "type": "RED_ALERT",
                            "agent": "当前坐席",
                            "keyword": word,
                            "context": text,
                            "screenshot": f"data:image/jpeg;base64,{capture_evidence()}"
                        }), 
                        main_loop
                    )
                    # 2. 数据库强制修改为高危客户
                    self.update_db_risk(customer_name, True)
                
                elif level == "HIGH" or level == "MEDIUM":
                    # 触发 SOP 指引
                    asyncio.run_coroutine_threadsafe(
                        broadcast_event({
                            "type": "SOP_GUIDE",
                            "steps": ["立即开启专业录音", "话术：为您转接高级主管", "禁止使用情绪化字眼"]
                        }),
                        main_loop
                    )
                
                else:
                    # LOW：仅进行画像打标
                    self.update_customer_tag(customer_name, word)

    def update_db_risk(self, name, is_risk):
        conn = sqlite3.connect("customers.db")
        conn.execute("UPDATE customers SET is_risk=? WHERE name=?", (is_risk, name))
        conn.commit()
        conn.close()

    def update_customer_tag(self, name, word):
        # 简单的自动打标逻辑
        tag = "价格敏感" if word == "贵" else "老客户" if word == "老客户" else "意向客户"
        conn = sqlite3.connect("customers.db")
        # 这里实际需要更复杂的去重和合并字符串逻辑
        conn.execute("UPDATE customers SET tags = tags || ? WHERE name=?", (f",{tag}", name))
        conn.commit()
        conn.close()

scanner = SmartScanner()

# 在主循环中定时运行扫描 (建议 3-5 秒一次，防止占用 CPU 过高)
def auto_scan_loop():
    print("👀 窗口感知扫描引擎已就位")
    while True:
        try:
            # 1. 检查当前前台窗口
            hwnd = win32gui.GetForegroundWindow()
            title = win32gui.GetWindowText(hwnd)
            
            # 2. 定义战术目标窗口 (微信、钉钉等)
            targets = ["微信", "WeChat", "钉钉", "DingTalk", "飞书", "Lark"]
            is_target = any(t.lower() in title.lower() for t in targets)
            
            if is_target:
                scanner.scan_screen()
                time.sleep(3) # 目标窗口在前台，保持标准频率
            else:
                # 非目标窗口，进入“节能模式”
                time.sleep(10) 
        except Exception as e:
            print(f"扫描异常: {e}")
            time.sleep(5)

# ... (在 main 中启动该线程)

# --- 启动服务 ---
if __name__ == "__main__":
    # 在独立线程运行键盘钩子
    threading.Thread(target=start_keyboard_hook, daemon=True).start()
    
    # 获取异步事件循环
    main_loop = asyncio.new_event_loop()
    
    # 启动自动扫描线程
    threading.Thread(target=auto_scan_loop, daemon=True).start()

    # 启动视频取证缓冲线程
    threading.Thread(target=forensic_loop, daemon=True).start()

    # 启动本地缓冲同步任务 (在主异步循环中)
    asyncio.run_coroutine_threadsafe(log_buffer.sync_task(), main_loop)
    
    threading.Thread(target=lambda: uvicorn.run(app, host="127.0.0.1", port=8000), daemon=True).start()
    
    print("🚀 Smart-CS Pro 核心引擎已启动 (Port: 8000)")
    while True: time.sleep(1)
