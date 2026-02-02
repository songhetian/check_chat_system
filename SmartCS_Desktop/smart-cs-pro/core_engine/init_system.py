import subprocess, sys, os, sqlite3, platform
from dotenv import load_dotenv

def check_env():
    print(f"🛠️  [Smart-CS Pro] 正在初始化 {platform.system()} 战术环境...")
    load_dotenv()
    
    # 1. 核心依赖检测
    dependencies = [
        "fastapi", "uvicorn", "pynput", "paddleocr", "opencv-python", 
        "httpx", "pandas", "openpyxl", "redis", "python-dotenv", 
        "pymysql", "pymysqlpool", "aiomysql"
    ]
    
    # 仅在 Windows 下安装 wmi
    if platform.system() == "Windows":
        dependencies.append("wmi")

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

    print("\n🚀 [系统就绪] 环境初始化完成！")

if __name__ == "__main__":
    check_env()

