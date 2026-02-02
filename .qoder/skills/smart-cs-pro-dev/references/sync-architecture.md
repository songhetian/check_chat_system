# Smart-CS Pro 工业级同步架构 (Sync Architecture)

## 1. 数据库职责划分
| 数据库 | 角色 | 存储内容 | 声明周期 |
| :--- | :--- | :--- | :--- |
| **MySQL** | **全局真相 (Single Source of Truth)** | 用户、部门、全量违规历史、全局审计、全景画像 | 永久存储 |
| **SQLite** | **边缘缓冲 (Edge Buffer)** | 本地配置缓存、断网暂存队列、当前键盘流 | 临时/覆盖 |

## 2. 同步状态逻辑 (State Machine)
1. **实时写入**: `process_violation` -> 尝试 `pymysql.connect`。
2. **连接成功**: 写入 MySQL，本地不存副本。
3. **连接失败**: 调用 `sync_manager.add_to_sync_queue` 存入 SQLite。
4. **后台补传**: `run_sync_worker` 每 10 秒轮询 SQLite，成功补传后立即 `DELETE` 本地记录。

## 3. 开发规范
- 任何涉及 `INSERT` 操作的逻辑，必须包裹在 `try...except` 中，并提供 `add_to_sync_queue` 作为 fallback。
- 严禁业务逻辑直接强依赖本地 SQLite 的查询结果作为最终结果。
