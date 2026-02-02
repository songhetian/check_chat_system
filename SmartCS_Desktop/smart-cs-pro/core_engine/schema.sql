-- Smart-CS Pro 战术系统数据库 Schema

-- 1. 客户画像表
CREATE TABLE IF NOT EXISTS customers (
    name TEXT PRIMARY KEY,
    level TEXT DEFAULT 'NEW',
    tags TEXT,
    ltv REAL DEFAULT 0,
    frequency INTEGER DEFAULT 1,
    is_risk BOOLEAN DEFAULT 0,
    last_seen REAL
);

-- 2. 战术目标平台表
CREATE TABLE IF NOT EXISTS platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    window_keyword TEXT,
    is_active BOOLEAN DEFAULT 1,
    sync_time REAL
);

-- 3. 全局审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operator TEXT,
    action TEXT,
    target TEXT,
    details TEXT,
    timestamp REAL
);

-- 4. 离线缓冲表
CREATE TABLE IF NOT EXISTS pending_logs (
    id TEXT PRIMARY KEY,
    data TEXT,
    timestamp REAL
);

-- 插入默认监控目标
INSERT OR IGNORE INTO platforms (name, window_keyword) VALUES ('WeChat', '微信');
INSERT OR IGNORE INTO platforms (name, window_keyword) VALUES ('DingTalk', '钉钉');
