-- [Smart-CS Pro] 中央指挥部 MySQL 数据库初始化脚本
-- 适用环境: 生产服务器 (192.168.2.184)

CREATE DATABASE IF NOT EXISTS smart_cs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_cs;

-- 1. 全球敏感词库 (坐席端 SQLite 只下载 active=1 的子集)
CREATE TABLE IF NOT EXISTS sensitive_words (
    id INT PRIMARY KEY AUTO_INCREMENT,
    word VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) DEFAULT 'GENERAL', -- 政治, 暴恐, 违规交易等
    risk_level INT DEFAULT 5,               -- 1-10 风险等级
    is_active TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. 全量违规取证记录 (这是最核心的数据资产，SQLite 不留存历史)
CREATE TABLE IF NOT EXISTS violation_records (
    id VARCHAR(50) PRIMARY KEY,
    agent_id VARCHAR(50) NOT NULL,          -- 哪个坐席违规
    keyword VARCHAR(100),                   -- 命中的词
    context TEXT,                           -- 上下文内容
    risk_score INT,                         -- AI 评分
    ai_reason TEXT,                         -- AI 给出的原因
    screenshot_url VARCHAR(255),            -- 截图在服务器的路径
    video_path VARCHAR(255),                -- 证据视频在服务器的路径
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_agent (agent_id),
    INDEX idx_time (timestamp)
) ENGINE=InnoDB;

-- 3. 全景客户画像表 (全公司共享)
CREATE TABLE IF NOT EXISTS customers (
    name VARCHAR(100) PRIMARY KEY,
    level VARCHAR(20) DEFAULT 'NEW',
    tags TEXT,                              -- 逗号分隔的标签
    ltv DECIMAL(12,2) DEFAULT 0.00,         -- 终身价值
    frequency INT DEFAULT 1,                -- 累计沟通次数
    is_risk TINYINT DEFAULT 0,              -- 是否黑名单
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. 战术目标平台管理
CREATE TABLE IF NOT EXISTS platforms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE,
    window_keyword VARCHAR(100),
    is_active TINYINT DEFAULT 1
) ENGINE=InnoDB;

-- 5. 全局合规审计日志 (记录主管和管理员的操作)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    operator VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target VARCHAR(100),
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 初始化默认数据
INSERT IGNORE INTO platforms (name, window_keyword) VALUES ('WeChat', '微信'), ('DingTalk', '钉钉');
INSERT IGNORE INTO sensitive_words (word, category, risk_level) VALUES ('加微信', '私单', 8), ('转账', '交易', 9), ('投诉', '纠纷', 7);
