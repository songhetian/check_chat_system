@echo off
:: 强制设置终端编码为 UTF-8 (代码页 65001)
chcp 65001 > nul
set PYTHONIOENCODING=utf-8

:: 0. 自动清理旧的引擎进程 (防止端口占用)
echo 🧹 Cleaning up zombie processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /f /pid %%a >nul 2>&1

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
python core_engine\utils\init_system.py

:: 4. 启动守护进程 (最小化窗口运行)
echo 🛡️  Launching Guardian Service...
cd core_engine
start /min "" python guardian.py
cd ..

:: 5. 启动前端
echo 💻 Awakening Interface...
npm run dev

pause
