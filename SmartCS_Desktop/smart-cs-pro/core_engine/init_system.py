import subprocess
import sys
import os
import sqlite3
from dotenv import load_dotenv

def check_env():
    print("🛠️  [Smart-CS Pro] 正在初始化工业级战术环境...")
    load_dotenv()
    
    # 1. 检查并安装全量核心依赖
    dependencies = [
        "fastapi", "uvicorn", "pynput", "paddleocr", "opencv-python", 
        "httpx", "wmi", "pandas", "openpyxl", "redis", "python-dotenv", 
        "pymysql", "pymysqlpool", "aiomysql", "aioredis"
    ]
    print("📦 正在检查核心依赖...")
    for lib in dependencies:
        try:
            lib_mod = lib.replace("-", "_")
            if lib == "opencv-python": __import__("cv2")
            else: __import__(lib_mod)
            print(f"  ✅ {lib} 已就绪")
        except ImportError:
            print(f"  ❌ 缺少依赖: {lib}，尝试自动安装...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", lib])

    # 2. 读取数据库配置并初始化本地表结构
    print(f"🗄️  正在初始化本地数据库架构 (SQLite Buffer)...")
    if os.path.exists("schema.sql"):
        with open("schema.sql", "r", encoding="utf-8") as f:
            sql_script = f.read()
        
        db_files = ["buffer.db"]
        for db in db_files:
            conn = sqlite3.connect(db)
            try:
                conn.executescript(sql_script)
                print(f"  ✅ 本地缓冲库 {db} 初始化成功")
            except:
                pass
            conn.close()

    print("\n🚀 [系统就绪] 环境初始化完成！")

if __name__ == "__main__":
    check_env()