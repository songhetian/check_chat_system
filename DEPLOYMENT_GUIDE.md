# 🛡️ Smart-CS 系统商业化部署手册 (V1.0)

本手册涵盖了 **服务端 (Server)**、**主管端 (Supervisor)** 和 **客服端 (Agent)** 的完整安装与分发流程。

---

## 一、 环境要求

### 1. 服务器 (Server)

- **操作系统**：Windows Server 2016+ 或 Windows 10/11 专业版。
- **运行环境**：Node.js 18.x 或 20.x (仅部署时需要)。
- **数据库**：MySQL 8.0 或 5.7。

### 2. 员工终端 (Clients)

- **操作系统**：Windows 10/11 (32/64 位)。
- **权限要求**：客服端需具备 **管理员权限**（用于底层 UIA 监控）。
- **依赖**：无需安装 Node.js 或任何开发环境（打包后为独立 `.exe`）。

---

## 二、 第一步：数据库初始化

1.  登录您的 MySQL 服务器。
2.  执行项目根目录下的脚本：
    ```bash
    mysql -u root -p < docs/database.sql
    ```
3.  **确认项**：确保 `smart_cs_db` 数据库已创建，且包含 `users`, `words`, `help_knowledge`, `monitor_logs` 等核心表。

---

## 三、 第二步：服务端部署 (中心站)

服务端是整个系统的指令与数据中心。

1.  **安装依赖**：
    ```bash
    cd server
    npm install
    ```
2.  **配置文件**：
    将 `server/.env.example` 重命名为 `server/.env`，并填入您的数据库信息。
3.  **启动与运行**：
    - **生产模式 (推荐)**：`npm run build` 然后 `node dist/main.js`
4.  **确认 IP**：在服务器命令行运行 `ipconfig`，记录当前的局域网 IP（如 `192.168.1.100`）。

---

## 四、 第三步：客户端打包与分发 (零环境交付)

### 1. 编译 React 资源

在两个客户端目录下分别执行：

```bash
cd agent-client && npm install && npm run build
cd supervisor-client && npm install && npm run build
```

### 2. 生成 .exe 安装程序

在客户端目录下执行 Electron 打包命令：

```bash
npm run build  # 此命令会根据 package.json 中的 build 配置生成安装包
```

- **产出物**：在 `dist_electron` 目录下会生成安装程序。

---

## 五、 第四步：员工端上线

1.  **文件分发**：将生成的 `.exe` 安装包通过内网发送给各部门员工。
2.  **首次登录配置**：
    - 双击安装并运行。
    - 若系统未自动识别服务器，在弹出的“服务器配置”框中输入 **步骤三中记录的服务器 IP**。
3.  **管理员权限 (客服端专属)**：
    - 客服端首次运行会请求 UIA 访问权限，请员工点击 **“以管理员身份运行”**。

---

## 六、 运维注意事项

1.  **静态 IP**：强烈建议为服务器分配 **固定静态 IP**。
2.  **杀毒软件**：由于涉及底层监控，请将软件添加至 **白名单**。
3.  **数据备份**：定期备份 MySQL 数据库，确保审计日志安全。
4.  **排他性登录**：系统默认开启“一号一机”策略，确保数据采集的唯一性。

- 超级管理员: admin / admin123
- 部门主管: supervisor / super123 (属于销售部)
- 一线客服: agent01 / agent123 (属于销售部)
