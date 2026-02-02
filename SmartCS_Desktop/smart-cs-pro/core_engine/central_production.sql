-- [Smart-CS Pro] 中央指挥部 MySQL 数据库初始化脚本 - 最终完全体
-- 包含: 组织架构、账号鉴权、设备准入、监控取证、战术物料

CREATE DATABASE IF NOT EXISTS smart_cs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_cs;

-- 1. 部门表 (用于行政层级隔离)
CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    parent_id INT DEFAULT 0,
    manager_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. 用户表 (包含加盐哈希密码与角色)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    salt VARCHAR(32) NOT NULL,
    real_name VARCHAR(50),
    role ENUM('AGENT', 'ADMIN', 'HQ') DEFAULT 'AGENT',
    department_id INT,
    authorized_device_id VARCHAR(100), -- 绑定的硬件指纹
    status TINYINT DEFAULT 1,          -- 1: 活跃, 0: 禁用
    last_login TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_user (username)
) ENGINE=InnoDB;

-- 3. 硬件设备白名单 (用于设备准入控制)
CREATE TABLE IF NOT EXISTS devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hwid VARCHAR(100) NOT NULL UNIQUE,
    user_id INT,
    status ENUM('PENDING', 'APPROVED', 'BLOCKED') DEFAULT 'PENDING',
    device_info TEXT,                  -- CPU/Disk 详细信息
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 4. 敏感词库
CREATE TABLE IF NOT EXISTS sensitive_words (
    id INT PRIMARY KEY AUTO_INCREMENT,
    word VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    risk_level INT DEFAULT 5,
    is_active TINYINT DEFAULT 1
) ENGINE=InnoDB;

-- 5. 违规取证记录
CREATE TABLE IF NOT EXISTS violation_records (
    id VARCHAR(50) PRIMARY KEY,
    user_id INT NOT NULL,
    keyword VARCHAR(100),
    context TEXT,
    risk_score INT,
    screenshot_url VARCHAR(255),
    video_path VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 6. 全景客户画像
CREATE TABLE IF NOT EXISTS customers (
    name VARCHAR(100) PRIMARY KEY,
    level VARCHAR(20) DEFAULT 'NEW',
    tags TEXT,
    ltv DECIMAL(12,2) DEFAULT 0.00,
    frequency INT DEFAULT 1,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 7. 战术广播日志 (强制已读广播)
CREATE TABLE IF NOT EXISTS broadcasts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    content TEXT,
    sender_id INT,
    target_dept_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 8. AI 效能统计表
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action_type ENUM('OPTIMIZE', 'SUMMARIZE'),
    chars_processed INT,             -- 处理的字符数
    estimated_time_saved INT,        -- 节省的预估时间 (秒)
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 初始化基础数据... (保持不变)
-- 演示账号: admin / admin (实际哈希和盐值需由 init_system 生成)
INSERT IGNORE INTO users (username, password_hash, salt, real_name, role, department_id) 
VALUES ('admin', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'salt123', '超级管理员', 'HQ', 1);