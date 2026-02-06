import subprocess
import sys
import os
import sqlite3
import platform
from dotenv import load_dotenv

def check_env():
    print(f"🛠️  [Smart-CS Pro] 正在初始化 {platform.system()} 战术环境...")
    load_dotenv()
    
    # 1. 核心依赖检测 (V3.10 精简版：仅保留 API 与数据库核心)
    dependencies = [
        "fastapi", "uvicorn", "redis", "python-dotenv", 
        "pymysql", "aiomysql", "tortoise-orm", "pypinyin", "websockets"
    ]
    
    # 仅在 Windows 下安装 wmi
    if platform.system() == "Windows":
        dependencies.append("wmi")

    print("📦 正在检查核心依赖...")
    for lib in dependencies:
        try:
            lib_mod = lib.replace("-", "_")
            if lib == "python-dotenv": __import__("dotenv")
            elif lib == "tortoise-orm": __import__("tortoise")
            else: __import__(lib_mod)
            print(f"  ✅ {lib} 已就绪")
        except ImportError:
            print(f"  ❌ 缺少依赖: {lib}，尝试自动安装...")
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", lib])
            except:
                print(f"  ⚠️  自动安装 {lib} 失败，请尝试手动运行: pip install {lib}")

    # 2. 读取数据库配置并初始化本地表结构
    print(f"🗄️  正在初始化本地数据库架构 (SQLite Buffer)...")
    schema_path = os.path.join(os.path.dirname(__file__), "..", "database", "schema.sql")
    if os.path.exists(schema_path):
        db_files = ["buffer.db", "customers.db", "audit.db", "platforms.db"]
        for db in db_files:
            try:
                conn = sqlite3.connect(db)
                with open(schema_path, "r", encoding="utf-8") as f:
                    sql_script = f.read()
                conn.executescript(sql_script)
                print(f"  ✅ 本地库 {db} 同步成功")
                conn.close()
            except Exception as e:
                print(f"  ⚠️ {db} 初始化跳过或已存在")

    print("\n🚀 [系统就绪] 环境初始化完成！")

if __name__ == "__main__":
    check_env()