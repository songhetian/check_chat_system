import subprocess
import time
import os
import sys
import psutil

# Configuration: What are we guarding?
TARGET_PROCESS = "SmartCS_Agent.exe" if sys.platform == "win32" else "SmartCS_Agent"
AGENT_SCRIPT = "agent_main.py" # For dev mode

def is_running(process_name):
    for proc in psutil.process_iter(['name']):
        if proc.info['name'] == process_name:
            return True
    return False

def launch_agent():
    print(f"⚠️ Guard: Detect Agent offline. Attempting to relaunch...")
    try:
        # Determine launch command based on context (source or bundled exe)
        if getattr(sys, 'frozen', False):
            # Running as bundled EXE
            exe_path = os.path.join(os.path.dirname(sys.executable), TARGET_PROCESS)
            if os.path.exists(exe_path):
                subprocess.Popen([exe_path], creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0)
        else:
            # Running from source (dev)
            python_path = sys.executable
            script_path = os.path.join(os.getcwd(), AGENT_SCRIPT)
            subprocess.Popen([python_path, script_path])
    except Exception as e:
        print(f"❌ Guard: Failed to relaunch: {e}")

def main():
    print(f"🛡️ Smart-CS Guard Active. Monitoring {TARGET_PROCESS}...")
    while True:
        try:
            if not is_running(TARGET_PROCESS):
                launch_agent()
        except Exception as e:
            pass
        
        # Check every 2 seconds
        time.sleep(2)

if __name__ == "__main__":
    # Ensure guard is truly silent on Windows
    main()
