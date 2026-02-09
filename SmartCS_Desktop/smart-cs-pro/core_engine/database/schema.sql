-- [Smart-CS Pro] 战术系统本地 SQLite 架构脚本 (V4.00)
-- 物理隔离：仅用于本地缓冲区、客户端缓存等场景

-- 1. 物理指令黑名单 (用于 JWT 撤回权)
CREATE TABLE IF NOT EXISTS blacklist (
    username TEXT PRIMARY KEY,
    expired_at INTEGER NOT NULL
);

-- 2. 离线 SOP 缓存
CREATE TABLE IF NOT EXISTS local_sops (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- JSON 数组
    sop_type TEXT NOT NULL, -- TEXT, MD, IMAGE, FILE, VIDEO
    department_id INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 本地审计足迹
CREATE TABLE IF NOT EXISTS local_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);