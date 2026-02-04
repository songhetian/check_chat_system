#!/bin/bash

# 获取脚本所在根目录的绝对路径
ROOT_DIR=$(cd "$(dirname "$0")"; pwd)
echo "🚀 [Smart-CS Pro] 正在初始化战术指挥链路..."
echo "📍 根目录: $ROOT_DIR"

# 1. 战术环境判定
PYTHON_EXEC="python3"
if [ -d "$ROOT_DIR/venv" ]; then
    PYTHON_EXEC="$ROOT_DIR/venv/bin/python"
    echo "  ✅ 锁定战术虚拟环境 (venv)"
else
    if command -v python3 >/dev/null 2>&1; then
        PYTHON_EXEC="python3"
        echo "  ⚠️  未发现 venv，回退至系统 python3"
    else
        PYTHON_EXEC="python"
        echo "  ⚠️  未发现 venv，回退至系统 python"
    fi
fi

# 2. 进入核心目录执行初始化
cd "$ROOT_DIR/SmartCS_Desktop/smart-cs-pro"
$PYTHON_EXEC core_engine/utils/init_system.py

# 3. 启动进程守卫 (后台静默运行)
echo "🛡️  正在启动进程守卫..."
cd core_engine
# 杀死可能残余的旧进程
pkill -f "python engine.py" > /dev/null 2>&1
# 使用动态判定的解释器
$PYTHON_EXEC utils/guardian.py > "$ROOT_DIR/engine.log" 2>&1 &
ENGINE_PID=$!
cd ..

# 4. 启动前端 UI
echo "💻 正在唤醒神经链路界面..."
npm run dev

# 退出时清理
trap "kill $ENGINE_PID" EXIT