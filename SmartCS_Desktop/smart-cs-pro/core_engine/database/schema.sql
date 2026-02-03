-- Smart-CS Pro 战术系统通用数据库 Schema (兼容 MySQL/SQLite)

-- 1. 客户画像表
CREATE TABLE IF NOT EXISTS customers (
    name VARCHAR(100) PRIMARY KEY,
    level VARCHAR(20) DEFAULT 'NEW',
    tags TEXT,
    ltv DECIMAL(10,2) DEFAULT 0,
    frequency INTEGER DEFAULT 1,
    is_risk TINYINT DEFAULT 0,
    last_seen DOUBLE
);

-- 2. 战术目标平台表
CREATE TABLE IF NOT EXISTS platforms (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE,
    window_keyword VARCHAR(100),
    is_active TINYINT DEFAULT 1,
    sync_time DOUBLE
);

-- 3. 全局审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    operator VARCHAR(50),
    action VARCHAR(50),
    target VARCHAR(100),
    details TEXT,
    timestamp DOUBLE
);

-- 4. 离线缓冲表
CREATE TABLE IF NOT EXISTS pending_logs (
    id VARCHAR(50) PRIMARY KEY,
    data TEXT,
    timestamp DOUBLE
);

-- 5. 系统用户表 (RBAC)
CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(50) PRIMARY KEY,
    password VARCHAR(100) NOT NULL,
    real_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'AGENT', -- 'AGENT', 'ADMIN', 'HQ'
    department VARCHAR(100),
    is_active TINYINT DEFAULT 1
);



-- 插入默认监控目标
INSERT IGNORE INTO platforms (name, window_keyword) VALUES ('WeChat', '微信');
INSERT IGNORE INTO platforms (name, window_keyword) VALUES ('DingTalk', '钉钉');
