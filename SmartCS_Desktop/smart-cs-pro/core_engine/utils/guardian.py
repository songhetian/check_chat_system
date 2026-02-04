import subprocess
import time
import os
import sys

def launch_guardian():
    # 动态获取 engine.py 的绝对路径（位于 guardian.py 的上一级目录）
    utils_dir = os.path.dirname(os.path.abspath(__file__))
    engine_dir = os.path.dirname(utils_dir)
    engine_path = os.path.join(engine_dir, "engine.py")
    
    print(f"🛡️  [Smart-CS Guardian] 守卫进程已就位")
    print(f"📍 目标路径: {engine_path}")
    
    cmd = [sys.executable, engine_path]
    
    while True:
        # 启动主引擎，并强制指定工作目录为 engine_dir，确保 engine.py 内部的相对导入正常
        process = subprocess.Popen(cmd, cwd=engine_dir)
        process.wait()
        
        # 如果退出码不为 0 (正常退出)，或者意外退出
        if process.returncode != 0:
            print(f"🚨 [警告] 主引擎意外崩溃！退出码: {process.returncode}")
            print("⏳ 正在尝试系统自愈 (1秒内重新拉起)...")
            time.sleep(1)
        else:
            print("🛑 主引擎正常关闭，守卫任务结束。")
            break

if __name__ == "__main__":
    launch_guardian()
