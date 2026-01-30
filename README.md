# Smart-CS System

## 项目启动说明

### 1. 数据库准备
- 安装 MySQL 8.0。
- 执行 `docs/database.sql` 中的脚本创建数据库和表。

### 2. 服务端运行
- 进入 `server` 目录。
- 运行 `npm install`。
- 修改 `src/app.module.ts` 中的数据库配置。
- 运行 `npm run start:dev`。

### 3. 客户端运行
- 分别进入 `agent-client` 和 `supervisor-client`。
- 运行 `npm install`。
- 运行 `npm start` 启动桌面程序。

## 功能路线图
- [x] 项目规划与架构设计
- [x] 数据库建模
- [ ] 服务端 API 开发 (进行中)
- [ ] 客服端 UIA 监控逻辑实现
- [ ] 界面 UI 视觉开发 (Semi Design)
