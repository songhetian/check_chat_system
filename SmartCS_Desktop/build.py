import os
import subprocess
import sys

def build_executable(script_name, output_name, icon_path=None, hidden_imports=None, noconsole=False):
    print(f"🔨 Building {output_name}...")
    
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--onefile",
        "--clean",
        f"--name={output_name}"
    ]
    
    if noconsole:
        cmd.append("--noconsole")
        
    cmd.append(script_name)
    
    # Add hidden imports if any
    if hidden_imports:
        for imp in hidden_imports:
            cmd.append(f"--hidden-import={imp}")
            
    # Add icon if available (Placeholder check)
    if icon_path and os.path.exists(icon_path):
        cmd.append(f"--icon={icon_path}")
        
    # For Agent/Admin, we might want --noconsole on Windows, but for debug let's keep console or make it configurable
    # cmd.append("--noconsole") 

    try:
        subprocess.check_call(cmd)
        print(f"✅ {output_name} built successfully!\n")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to build {output_name}: {e}")

if __name__ == "__main__":
    # Ensure pyinstaller is installed
    try:
        import PyInstaller
    except ImportError:
        print("Installing PyInstaller...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])

    # 1. Build Agent (SmartCS Client)
    build_executable(
        "agent_main.py", 
        "SmartCS_Agent",
        hidden_imports=["pynput.keyboard._win32", "pynput.mouse._win32", "requests", "pyperclip"],
        noconsole=True 
    )

    # 2. Build Guard
    build_executable(
        "core/guard_service.py",
        "SmartCS_Guard",
        hidden_imports=["requests"],
        noconsole=True 
    )

    # 3. Build Admin
    build_executable(
        "admin_main.py",
        "SmartCS_Admin",
        hidden_imports=["requests"]
    )

    # 4. Build HQ
    build_executable(
        "hq_main.py",
        "SmartCS_HQ",
        hidden_imports=["requests"],
        noconsole=False 
    )

    # 5. Build Server
    build_executable(
        "server/main.py",
        "SmartCS_Server",
        hidden_imports=["uvicorn.logging", "uvicorn.loops", "uvicorn.loops.auto", "uvicorn.protocols", "uvicorn.protocols.http", "uvicorn.protocols.http.auto", "uvicorn.protocols.websockets", "uvicorn.protocols.websockets.auto", "uvicorn.lifespan.on"]
    )

    print("🎉 All builds completed. Check the 'dist' folder.")
