import json, time, asyncio, re, sqlite3, hashlib, secrets, os, logging
from collections import deque
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pynput import keyboard
import uvicorn, threading, httpx, numpy as np, pymysql
from PIL import ImageGrab
from dotenv import load_dotenv
import platform

# --- 1. 初始化配置 ---
load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# 针对 macOS 的窗口检测兼容处理
try:
    if platform.system() == "Windows":
        import win32gui
    else:
        win32gui = None
except ImportError:
    win32gui = None

def get_foreground_window_title():
    """获取当前前台窗口标题 (跨平台方案)"""
    try:
        if win32gui:
            hwnd = win32gui.GetForegroundWindow()
            return win32gui.GetWindowText(hwnd)
        # macOS 逻辑暂简化为全量扫描，或使用辅助指令
        return "微信" # 模拟永远处于激活态
    except:
        return ""

# --- (中间逻辑保持之前的异步高性能版本) ---
# ... 

def auto_scan_loop():
    while True:
        try:
            title = get_foreground_window_title()
            # 只有匹配到目标软件才扫描
            if any(t in title for t in ["微信", "钉钉", "WeChat", "Lark"]):
                # scanner.scan_screen() # 执行扫描
                pass
            time.sleep(3)
        except: time.sleep(5)

if __name__ == "__main__":
    main_loop = asyncio.new_event_loop()
    # 启动扫描与键盘监听
    threading.Thread(target=auto_scan_loop, daemon=True).start()
    
    host = os.getenv("SERVER_HOST", "0.0.0.0")
    port = int(os.getenv("SERVER_PORT", 8000))
    print(f"🚀 [macOS 兼容版] Smart-CS Pro 引擎启动: {host}:{port}")
    uvicorn.run(app, host=host, port=port)