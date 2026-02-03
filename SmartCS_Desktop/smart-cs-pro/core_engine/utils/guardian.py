import subprocess
import time
import os
import sys

def launch_guardian():
    print("🛡️  [Smart-CS Guardian] 守卫进程已就位，正在护航主引擎...")
    
    cmd = [sys.executable, "engine.py"]
    
    while True:
        # 启动主引擎并等待其退出
        process = subprocess.Popen(cmd)
        process.wait()
        
        # 如果退出码不为 0 (正常退出)，或者意外退出
        if process.returncode != 0:
            print(f"🚨 [警告] 主引擎意外崩溃或被强行关闭！退出码: {process.returncode}")
            print("⏳ 正在尝试系统自愈 (1秒内重新拉起)...")
            time.sleep(1)
        else:
            # 正常退出，守卫也退出
            print("🛑 主引擎正常关闭，守卫任务结束。")
            break

if __name__ == "__main__":
    launch_guardian()
