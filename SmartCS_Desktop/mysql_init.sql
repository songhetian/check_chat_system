-- Smart-CS MySQL Initialization Script (V27.0)
-- 建议字符集：utf8mb4 保证对中文和 Emoji 的完美支持

CREATE DATABASE IF NOT EXISTS smart_cs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_cs;

-- 1. 敏感词/监控词表
CREATE TABLE IF NOT EXISTS `sensitive_words` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `word` VARCHAR(100) UNIQUE NOT NULL,
    `level` VARCHAR(20) DEFAULT 'Medium', -- High, Medium, Monitor
    `action` VARCHAR(50) DEFAULT 'Alert', -- Alert, Block, Shake
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 知识库/话术表
CREATE TABLE IF NOT EXISTS `knowledge_base` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `keywords` VARCHAR(200),
    `question` VARCHAR(500),
    `answer` TEXT,
    `category` VARCHAR(50),
    `usage_count` INT DEFAULT 0
);

-- 3. SOP 流程指引表
CREATE TABLE IF NOT EXISTS `process_guidance` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `keyword` VARCHAR(100) UNIQUE NOT NULL,
    `title` VARCHAR(200),
    `content` TEXT,
    `image_url` VARCHAR(500),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 商品信息表
CREATE TABLE IF NOT EXISTS `products` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(200) NOT NULL,
    `sku` VARCHAR(50) UNIQUE NOT NULL,
    `price` FLOAT DEFAULT 0.0,
    `stock` INT DEFAULT 0,
    `specs` TEXT,
    `selling_points` TEXT,
    `tags` VARCHAR(200),
    `department` VARCHAR(50) DEFAULT 'General'
);

-- 5. 客户画像表
CREATE TABLE IF NOT EXISTS `customers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `external_id` VARCHAR(100) UNIQUE NOT NULL,
    `name` VARCHAR(100),
    `department` VARCHAR(50) DEFAULT 'General',
    `avatar_url` VARCHAR(500),
    `level` VARCHAR(20) DEFAULT 'Lv1',
    `ltv` FLOAT DEFAULT 0.0,
    `return_rate` FLOAT DEFAULT 0.0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. 客户标签记录表
CREATE TABLE IF NOT EXISTS `customer_tags` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT,
    `tag_text` VARCHAR(50),
    `tag_type` VARCHAR(20), -- Private, Dept, Global
    `created_by_agent` VARCHAR(50),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. 审计日志/证据留存表
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `agent_id` VARCHAR(50),
    `event_type` VARCHAR(50), -- Violation, Help, Login
    `details` TEXT,
    `screenshot_path` VARCHAR(200),
    `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. 客服荣誉/绩效表
CREATE TABLE IF NOT EXISTS `agent_performance` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `agent_id` VARCHAR(50) UNIQUE NOT NULL,
    `clean_days` INT DEFAULT 0,
    `safe_messages` INT DEFAULT 0,
    `honor_points` INT DEFAULT 0,
    `department` VARCHAR(50)
);

-- 预置一些基础数据
INSERT IGNORE INTO `sensitive_words` (word, level, action) VALUES ('scam', 'High', 'Block'), ('骗子', 'High', 'Block'), ('退款', 'Medium', 'Alert');
INSERT IGNORE INTO `process_guidance` (keyword, title, content) VALUES ('退货', '退货登记标准流程', '1.核实订单 2.ERP登记');
