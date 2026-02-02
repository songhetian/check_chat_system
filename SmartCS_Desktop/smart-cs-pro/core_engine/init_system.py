import subprocess
import sys
import os
import sqlite3

def check_env():
    print("🛠️  [Smart-CS Pro] 正在初始化工业级战术环境...")
    
    # 1. 检查 Python 依赖
    dependencies = ["fastapi", "uvicorn", "pynput", "paddleocr", "opencv-python", "httpx", "wmi"]
    print("📦 正在检查核心依赖...")
    for lib in dependencies:
        try:
            __import__(lib if lib != "opencv-python" else "cv2")
            print(f"  ✅ {lib} 已就绪")
        except ImportError:
            print(f"  ❌ 缺少依赖: {lib}，尝试自动安装...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", lib])

    # 2. 初始化数据库
    db_files = ["customers.db", "buffer.db"]
    print("🗄️  正在同步本地战术数据库...")
    for db in db_files:
        if not os.path.exists(db):
            conn = sqlite3.connect(db)
            if db == "customers.db":
                conn.execute("CREATE TABLE customers (name TEXT PRIMARY KEY, ltv REAL, tags TEXT, is_risk BOOLEAN)")
                print(f"  ✅ {db} 初始化成功")
            conn.close()
        else:
            print(f"  ✅ {db} 已存在")

    print("\n🚀 [系统就绪] 环境初始化完成！")
    print("请运行: npm run dev 启动前端")
    print("请运行: python engine.py 启动核心引擎")

if __name__ == "__main__":
    check_env()
