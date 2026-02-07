import os
import subprocess
import sys
import shutil

def build():
    print("🚀 [构建中心] 正在启动物理引擎固化流程...")

    # 1. 检查依赖
    try:
        import PyInstaller
    except ImportError:
        print("📦 正在安装打包工具 PyInstaller...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])

    # 2. 清理旧构建
    for d in ['build', 'dist']:
        if os.path.exists(d):
            shutil.rmtree(d)

    # 3. 核心打包指令
    # --distpath: 直接输出到 Electron 的 resources 目录，确保打包即生效
    dist_path = os.path.abspath(os.path.join(os.getcwd(), "..", "resources"))
    cmd = [
        "pyinstaller",
        "--onefile",
        "--noconsole",
        "--name", "SmartCS_Engine",
        "--distpath", dist_path,
        "--clean",
        "engine.py"
    ]

    print(f"🛠️ 正在执行物理固化: {' '.join(cmd)}")
    subprocess.check_call(cmd)

    print("" + "="*50)
    print("✅ [构建成功] 物理引擎已固化！")
    print(f"📍 生成路径: {os.path.join(os.getcwd(), 'dist', 'SmartCS_Engine.exe')}")
    print("="*50)

if __name__ == "__main__":
    build()
