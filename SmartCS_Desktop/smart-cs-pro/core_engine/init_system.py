import subprocess
import sys
import os
import sqlite3
from dotenv import load_dotenv

def check_env():
    print("🛠️  [Smart-CS Pro] 正在初始化工业级战术环境...")
    load_dotenv()
    
    # 1. 检查并安装核心依赖
    dependencies = [
        "fastapi", "uvicorn", "pynput", "paddleocr", "opencv-python", 
        "httpx", "wmi", "pandas", "openpyxl", "redis", "python-dotenv", 
        "pymysql", "pymysqlpool", "aiomysql"
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

    # 2. 读取数据库配置
    db_type = os.getenv("DB_TYPE", "sqlite")
    
    # 3. 执行 SQL 初始化
    print(f"🗄️  正在初始化 [{db_type.upper()}] 数据库架构...")
    
    if not os.path.exists("schema.sql"):
        print("❌ 错误: 未找到 schema.sql 文件")
        return

    with open("schema.sql", "r", encoding="utf-8") as f:
        sql_script = f.read()

    if db_type == "sqlite":
        db_files = ["customers.db", "buffer.db", "audit.db", "platforms.db"]
        for db in db_files:
            with sqlite3.connect(db) as conn:
                try:
                    conn.executescript(sql_script)
                    print(f"  ✅ SQLite {db} 同步成功")
                except Exception as e: print(f"  ⚠️ {db} 同步跳过: {e}")
    
    elif db_type == "mysql":
        import pymysql
        try:
            # 建立 MySQL 连接
            conn = pymysql.connect(
                host=os.getenv("DB_HOST"),
                port=int(os.getenv("DB_PORT", 3306)),
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASSWORD"),
                charset='utf8mb4'
            )
            with conn.cursor() as cursor:
                # 创建数据库 (如果不存在)
                db_name = os.getenv("DB_NAME")
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
                cursor.execute(f"USE {db_name}")
                
                # 执行建表语句 (简单处理：按分号切割执行)
                for statement in sql_script.split(';'):
                    if statement.strip():
                        cursor.execute(statement)
                conn.commit()
            print(f"  ✅ MySQL [{db_name}] 架构同步成功")
            conn.close()
        except Exception as e:
            print(f"  ❌ MySQL 连接失败，请检查 .env 配置或数据库权限: {e}")

    print("\n🚀 [系统就绪] 环境初始化完成！")

if __name__ == "__main__":
    check_env()
