# 🚀 Smart-CS 数智化运营平台 - 部署与打包指南 (V9.0)

本文档详细说明如何将 Smart-CS 系统从开发环境迁移至生产环境，包括环境配置、可执行文件打包以及服务器部署流程。

---

## 1. 📋 环境准备 (Prerequisites)

在开始之前，请确保你的开发机或构建机满足以下要求：

*   **操作系统**: Windows 10/11 或 macOS (建议使用与目标客户端相同的系统进行打包)。
*   **Python**: 版本 3.10 或更高 (建议使用虚拟环境)。
*   **依赖服务**:
    *   **MySQL 8.0+**: 用于存储持久化数据 (生产环境)。
    *   **Redis 7.0+**: 用于消息队列与实时状态同步 (可选，若无则使用内存模式)。

---

## 2. ⚙️ 配置管理 (Configuration)

系统使用 `.env` 文件进行环境隔离。在**源码运行**或**打包部署**时，都需要关注此文件。

### 2.1 配置文件结构
在 `SmartCS_Desktop/` 根目录下找到或新建 `.env` 文件：

```ini
# --- 数据库配置 ---
# 类型: sqlite (默认) 或 mysql
DB_TYPE=mysql
DB_HOST=192.168.1.100
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=secure_password
DB_NAME=smart_cs_prod

# --- Redis 配置 (可选) ---
# 若留空则不启用 Redis
REDIS_HOST=192.168.1.100
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# --- 服务端监听 ---
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
```

---

## 3. 🛠️ 源码修改 (Critical Step)

在打包客户端 (`Agent` 和 `Admin`) 之前，**必须**将代码中硬编码的本地地址 (`localhost`) 修改为你的生产服务器 IP。

### 3.1 修改坐席端 (Agent)
打开 `SmartCS_Desktop/agent_main.py`，搜索 `ws://localhost:8000`：

```python
# 修改前
client = SocketClient(f"ws://localhost:8000/ws/agent/{agent_id}", ...)

# 修改后 (假设服务器 IP 为 192.168.1.100)
client = SocketClient(f"ws://192.168.1.100:8000/ws/agent/{agent_id}", ...)
```

### 3.2 修改管理端 (Admin)
打开 `SmartCS_Desktop/admin_main.py`，同样修改连接地址：

```python
# 修改前
client = SocketClient("ws://localhost:8000/ws/admin", ...)

# 修改后
client = SocketClient("ws://192.168.1.100:8000/ws/admin", ...)
```

> **注意**: 也可以将此 IP 提取到外部配置文件中读取，但在 V9.0 版本中，直接修改源码是最快的方式。

---

## 4. 📦 打包与编译 (Build Process)

我们使用 `PyInstaller` 将 Python 代码编译为独立的可执行文件 (`.exe` 或 Unix Executable)。

### 4.1 激活虚拟环境
确保你已安装所有依赖：
```bash
cd SmartCS_Desktop
# macOS/Linux
source ../venv/bin/activate
# Windows
..\venv\Scripts\activate

pip install -r requirements.txt
pip install pyinstaller
```

### 4.2 一键构建
运行项目自带的构建脚本：

```bash
python build.py
```

脚本会自动执行以下操作：
1.  编译 `agent_main.py` -> `dist/SmartCS_Agent` (坐席端)
2.  编译 `admin_main.py` -> `dist/SmartCS_Admin` (管理端)
3.  编译 `server/main.py` -> `dist/SmartCS_Server` (服务端)

**构建成功后，所有文件将生成在 `SmartCS_Desktop/dist/` 目录下。**

---

## 5. 🚀 部署流程 (Deployment)

### 5.1 服务端部署 (Server Side)

1.  **上传文件**: 将 `dist/SmartCS_Server` (或 .exe) 和 `.env` 文件上传到服务器目录 (例如 `/opt/smartcs/`)。
2.  **创建资源目录**: 确保同级目录下存在 `assets/screenshots` 文件夹，用于存储截图。
    ```bash
    mkdir -p /opt/smartcs/assets/screenshots
    ```
3.  **启动服务**:
    ```bash
    # Linux (后台运行)
    nohup ./SmartCS_Server > server.log 2>&1 &
    
    # Windows
    Start-Process -FilePath "SmartCS_Server.exe" -WindowStyle Hidden
    ```
4.  **防火墙**: 确保服务器的 **8000** (WebSocket/API)、**3306** (MySQL)、**6379** (Redis) 端口对内网开放。

### 5.2 客户端分发 (Client Side)

#### 方案 A: 直接分发
将 `dist/SmartCS_Agent.exe` 和 `dist/SmartCS_Admin.exe` 直接发送给员工安装。

#### 方案 B: 制作安装包 (推荐 Windows)
使用 **Inno Setup** 编译 `SmartCS_Desktop/setup.iss` 脚本。
1.  安装 Inno Setup 编译器。
2.  双击打开 `setup.iss`。
3.  点击 "Compile"。
4.  生成 `Output/SmartCS_Setup_V9.exe`，该安装包会自动包含所有依赖并创建桌面快捷方式。

---

## 6. ❓ 常见问题 (Troubleshooting)

**Q1: 坐席端启动后报错或闪退？**
*   **原因**: 底层键盘钩子 (`pynput`) 需要系统权限。
*   **解决**:
    *   **macOS**: 在 "安全性与隐私 -> 辅助功能" 中添加终端或应用白名单。
    *   **Windows**: 某些杀毒软件会拦截键盘监听，需添加信任白名单。

**Q2: 无法连接到服务器？**
*   检查 **Step 3** 中的 IP 是否修改正确。
*   检查服务器防火墙是否放行 8000 端口。
*   检查 `.env` 文件是否与 `SmartCS_Server` 在同一目录。

**Q3: 截图无法显示？**
*   确保服务端 `assets` 目录有写入权限。
*   确保客户端网络能访问 HTTP 静态资源接口 (`http://ServerIP:8000/static/...`)。
