#!/bin/bash

# 获取脚本所在根目录的绝对路径
ROOT_DIR=$(cd "$(dirname "$0")"; pwd)
echo "🚀 [Smart-CS Pro] 正在初始化战术指挥链路..."
echo "📍 根目录: $ROOT_DIR"

# 1. 检查并激活虚拟环境
if [ -d "$ROOT_DIR/venv" ]; then
    source "$ROOT_DIR/venv/bin/activate"
    echo "  ✅ 虚拟环境已激活"
else
    echo "  ❌ 错误: 未在根目录找到 venv 环境，请先创建虚拟环境。"
    exit 1
fi

# 2. 进入核心目录执行初始化
cd "$ROOT_DIR/SmartCS_Desktop/smart-cs-pro"
python core_engine/init_system.py

# 3. 启动进程守卫 (后台静默运行)
echo "🛡️  正在启动 macOS 兼容版进程守卫..."
cd core_engine
# 杀死可能残余的旧进程
pkill -f "python engine.py" > /dev/null 2>&1
# 关键修复：显式指定 venv 中的 python 路径
"$ROOT_DIR/venv/bin/python" utils/guardian.py > "$ROOT_DIR/engine.log" 2>&1 &
ENGINE_PID=$!
cd ..

# 4. 启动前端 UI
echo "💻 正在唤醒神经链路界面..."
npm run dev

# 退出时清理
trap "kill $ENGINE_PID" EXIT