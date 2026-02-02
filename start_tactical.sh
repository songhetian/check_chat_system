#!/bin/bash

echo "🚀 [Smart-CS Pro] 正在初始化战术指挥链路..."

# 1. 进入核心目录
cd SmartCS_Desktop/smart-cs-pro

# 2. 检查并激活虚拟环境 (假设根目录下有 venv)
if [ -d "../../venv" ]; then
    source ../../venv/bin/activate
    echo "  ✅ 虚拟环境已激活"
else
    echo "  ⚠️ 未找到虚拟环境，请先创建 venv"
fi

# 3. 运行环境自检与数据库初始化
python3 core_engine/init_system.py

# 4. 启动 Python 守卫进程 (后台运行)
echo "🛡️  正在启动进程守卫 (Guardian)..."
cd core_engine
python3 guardian.py > ../../../engine.log 2>&1 &
ENGINE_PID=$!
cd ..

# 5. 启动前端 UI
echo "💻 正在唤醒神经链路界面..."
npm run dev

# 退出时清理后台进程
trap "kill $ENGINE_PID" EXIT
