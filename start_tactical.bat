@echo off
title Smart-CS Pro Tactical Launcher
echo 🚀 [Smart-CS Pro] Starting Tactical Systems...

:: 1. 进入核心目录
cd /d "%~dp0SmartCS_Desktop\smart-cs-pro"

:: 2. 检查并激活虚拟环境
if exist "..\..\venv\Scripts\activate.bat" (
    call "..\..\venv\Scripts\activate.bat"
    echo   ✅ Virtual Env Activated
) else (
    echo   ⚠️ Virtual Env NOT FOUND
)

:: 3. 运行环境自检
python core_engine\init_system.py

:: 4. 启动守护进程 (最小化窗口运行)
echo 🛡️  Launching Guardian Service...
cd core_engine
start /min "" python guardian.py
cd ..

:: 5. 启动前端
echo 💻 Awakening Interface...
npm run dev

pause
