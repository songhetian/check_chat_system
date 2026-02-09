-- [Smart-CS Pro] 战术系统本地 SQLite 架构脚本 (V4.50)
-- 物理隔离：用于客户端本地缓冲区、离线模式、API 缓存等

-- 1. 物理指令黑名单 (用于 JWT 实时撤回权)
CREATE TABLE IF NOT EXISTS blacklist (
    username TEXT PRIMARY KEY,
    expired_at INTEGER NOT NULL
);

-- 2. 离线 SOP 缓存
CREATE TABLE IF NOT EXISTS local_sops (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- 存储格式：JSON 数组 ["url1", "url2"]
    sop_type TEXT NOT NULL, -- 类型：TEXT, MD, IMAGE, FILE, VIDEO
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

-- 4. 离线队列同步表 (V3.90)
CREATE TABLE IF NOT EXISTS offline_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    method TEXT NOT NULL,
    data TEXT,
    headers TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. API 结果快照缓存 (V3.90)
CREATE TABLE IF NOT EXISTS api_cache (
    url TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
