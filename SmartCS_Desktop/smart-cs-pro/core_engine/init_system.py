import subprocess
import sys
import os
import sqlite3

def check_env():
    print("🛠️  [Smart-CS Pro] 正在初始化工业级战术环境...")
    
    # 1. 检查并安装核心依赖
    dependencies = ["fastapi", "uvicorn", "pynput", "paddleocr", "opencv-python", "httpx", "wmi", "pandas", "openpyxl", "redis", "python-dotenv"]
    print("📦 正在检查核心依赖...")
    for lib in dependencies:
        try:
            lib_mod = lib.replace("-", "_")
            __import__(lib_mod if lib != "opencv-python" else "cv2")
            print(f"  ✅ {lib} 已就绪")
        except ImportError:
            print(f"  ❌ 缺少依赖: {lib}，尝试自动安装...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", lib])

    # 2. 检查 .env 文件
    if not os.path.exists(".env"):
        print("📝 正在创建默认 .env 配置文件...")
        with open(".env", "w") as f:
            f.write("JWT_SECRET=smart-cs-secure-key-2024\nSERVER_IP=0.0.0.0\nSERVER_PORT=8000\n")

    # 3. 执行 SQL 初始化
    db_files = ["customers.db", "buffer.db", "audit.db", "platforms.db"]
    print("🗄️  正在根据 schema.sql 初始化数据库...")
    if os.path.exists("schema.sql"):
        with open("schema.sql", "r", encoding="utf-8") as f:
            sql_script = f.read()
        
        for db in db_files:
            conn = sqlite3.connect(db)
            try:
                conn.executescript(sql_script)
                print(f"  ✅ {db} 初始化/同步成功")
            except Exception as e:
                print(f"  ⚠️ {db} 同步跳过: {e}")
            conn.close()

    print("\n🚀 [系统就绪] 环境初始化完成！")

if __name__ == "__main__":
    check_env()