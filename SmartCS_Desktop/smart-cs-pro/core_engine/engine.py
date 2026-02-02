import json, time, asyncio, re, sqlite3, hashlib, secrets, os, logging
from datetime import datetime
from collections import deque
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn, threading, httpx, numpy as np, pymysql
from PIL import ImageGrab
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"])

def get_db_conn():
    return pymysql.connect(host=os.getenv("DB_HOST"), user=os.getenv("DB_USER"), password=os.getenv("DB_PASSWORD"), database=os.getenv("DB_NAME"), cursorclass=pymysql.cursors.DictCursor)

class TacticalPerformanceManager:
    def __init__(self):
        self.daily_history = {} # {username: {date: set(customers)}}
        self.last_sentiment = {} # {username: score}

    async def calculate_reward(self, username, event_data):
        """
        [工业级进阶算法] 多维度激励机制
        """
        score_delta = 0
        reason = ""
        
        etype = event_data.get("type")
        
        if etype == "AI_ADOPT": # 坐席点击了采用建议
            score_delta = 30
            reason = "积极采用 AI 战术建议"
        
        elif etype == "SENTIMENT_UPDATE": # 情绪变化
            cur_s = event_data.get("score", 50)
            last_s = self.last_sentiment.get(username, 50)
            if last_s < 40 and cur_s > 70:
                score_delta = 100 # 情绪大幅转正奖
                reason = "卓越危机公关：客户情绪成功转正"
            self.last_sentiment[username] = cur_s

        if score_delta != 0:
            try:
                conn = get_db_conn()
                with conn.cursor() as cursor:
                    cursor.execute("UPDATE users SET tactical_score = tactical_score + %s WHERE username = %s", (score_delta, username))
                    # 记录奖励审计
                    cursor.execute("INSERT INTO audit_logs (operator, action, target, details) VALUES (%s, 'SCORE_REWARD', %s, %s)",
                                   ("SYSTEM_AI", username, reason))
                conn.commit(); conn.close()
                await broadcast_event({"type": "REWARD_NOTIFY", "username": username, "msg": reason, "delta": score_delta})
    except: pass

perf_manager = TacticalPerformanceManager()

# ... (保持原有 WebSocket 逻辑，但调用新的 reward 接口)
@app.post("/api/ai/action/adopt")
async def notify_ai_adopt(data: dict):
    """前端点击一键采用时调用"""
    await perf_manager.calculate_reward(data["username"], {"type": "AI_ADOPT"})
    return {"status": "ok"}