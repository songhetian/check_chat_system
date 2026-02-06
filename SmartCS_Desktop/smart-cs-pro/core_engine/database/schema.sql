-- Smart-CS Pro 战术系统通用数据库 Schema (兼容 MySQL/SQLite)

-- 1. 客户画像表
CREATE TABLE IF NOT EXISTS customers (
    name VARCHAR(100) PRIMARY KEY,
    level VARCHAR(20) DEFAULT 'NEW',
    tags TEXT,
    ltv DECIMAL(12,2) DEFAULT 0.00,
    frequency INTEGER DEFAULT 1,
    is_deleted TINYINT DEFAULT 0,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 战术目标监控平台表
CREATE TABLE IF NOT EXISTS platforms (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    keyword VARCHAR(50) NOT NULL UNIQUE,
    is_active TINYINT DEFAULT 1,
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 全局合规审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    operator VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target VARCHAR(100),
    details TEXT,
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 商品战术资产表
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    usp TEXT,
    stock INT DEFAULT 0,
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 系统通知中心
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(50) DEFAULT 'INFO',
    is_read TINYINT DEFAULT 0,
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 离线缓冲表
CREATE TABLE IF NOT EXISTS pending_logs (
    id VARCHAR(50) PRIMARY KEY,
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 系统用户表 (RBAC - 基础兼容版)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    salt VARCHAR(32) NOT NULL,
    real_name VARCHAR(50),
    role_id INTEGER NOT NULL,
    department_id INTEGER,
    status TINYINT DEFAULT 1,
    is_deleted TINYINT DEFAULT 0,
    tactical_score INT DEFAULT 100
);




-- 插入默认监控目标
INSERT IGNORE INTO platforms (name, window_keyword) VALUES ('WeChat', '微信');
INSERT IGNORE INTO platforms (name, window_keyword) VALUES ('DingTalk', '钉钉');
