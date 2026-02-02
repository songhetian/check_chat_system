# Smart-CS Pro 工业级部署规范

## 1. 配置文件层次
- **`.env` (环境密钥)**: 仅限本地存储，存放 IP、端口、密码、JWT 密钥。
- **`server_config.json` (业务逻辑)**: 存放在 Git 仓库，定义 AI 模型偏好、同步间隔、UI 选项。

## 2. 数据库初始化
- **脚本**: 运行 `python core_engine/init_system.py`。
- **Schema**: 建表语句统一维护在 `core_engine/schema.sql`。

## 3. 部署流程
1. 克隆代码。
2. 配置 `.env`。
3. 运行 `init_system.py` 安装依赖并建表。
4. 启动后端 `engine.py`。
5. 启动前端 `npm run dev`。
