-- [Smart-CS Pro] 中央指挥部 MySQL 数据库初始化脚本 - 工业级正式版
-- 修复：修正了语法中断错误，调整了建表顺序以满足外键约束

CREATE DATABASE IF NOT EXISTS smart_cs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_cs;

-- 1. 部门表 (前置定义，manager_id 将在 users 表之后通过 ALTER 添加，或者使用延迟约束)
CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    parent_id INT DEFAULT 0,
    manager_id INT, -- 新增：部门主管 ID
    is_deleted TINYINT DEFAULT 0, -- 软删除标记
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    salt VARCHAR(32) NOT NULL,
    real_name VARCHAR(50),
    role ENUM('AGENT', 'ADMIN', 'HQ') DEFAULT 'AGENT',
    department_id INT,
    authorized_device_id VARCHAR(100),
    status TINYINT DEFAULT 1, -- 账号冻结状态
    is_deleted TINYINT DEFAULT 0, -- 软删除标记
    streak_days INT DEFAULT 0,
    handled_customers_count INT DEFAULT 0,
    ai_adoption_count INT DEFAULT 0,
    tactical_score INT DEFAULT 0,
    rank_level VARCHAR(20) DEFAULT 'NOVICE',
    graduated_at TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_user (username)
) ENGINE=InnoDB;

-- 为部门表添加主管外键
ALTER TABLE departments ADD CONSTRAINT fk_dept_manager FOREIGN KEY (manager_id) REFERENCES users(id);


-- 3. 战术等级进阶配置表
CREATE TABLE IF NOT EXISTS rank_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rank_name VARCHAR(20) UNIQUE,
    display_name VARCHAR(50),
    min_days INT DEFAULT 0,
    min_volume INT DEFAULT 0,
    min_ai_adoption INT DEFAULT 0,
    icon_tag VARCHAR(20),
    is_deleted TINYINT DEFAULT 0
) ENGINE=InnoDB;

-- 4. 智能带教知识库
CREATE TABLE IF NOT EXISTS knowledge_base (
    id INT PRIMARY KEY AUTO_INCREMENT,
    keyword VARCHAR(100) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50),
    is_active TINYINT DEFAULT 1,
    is_deleted TINYINT DEFAULT 0
) ENGINE=InnoDB;

-- 5. 硬件设备白名单
CREATE TABLE IF NOT EXISTS devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hwid VARCHAR(100) NOT NULL UNIQUE,
    user_id INT,
    status ENUM('PENDING', 'APPROVED', 'BLOCKED') DEFAULT 'PENDING',
    device_info TEXT,
    is_deleted TINYINT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 6. 敏感词库
CREATE TABLE IF NOT EXISTS sensitive_words (
    id INT PRIMARY KEY AUTO_INCREMENT,
    word VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    risk_level INT DEFAULT 5,
    is_active TINYINT DEFAULT 1,
    is_deleted TINYINT DEFAULT 0
) ENGINE=InnoDB;

-- 7. 违规取证记录
CREATE TABLE IF NOT EXISTS violation_records (
    id VARCHAR(50) PRIMARY KEY,
    user_id INT NOT NULL,
    keyword VARCHAR(100),
    context TEXT,
    risk_score INT,
    screenshot_url VARCHAR(255),
    video_path VARCHAR(255),
    is_deleted TINYINT DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 8. 全景客户画像
CREATE TABLE IF NOT EXISTS customers (
    name VARCHAR(100) PRIMARY KEY,
    level VARCHAR(20) DEFAULT 'NEW',
    tags TEXT,
    ltv DECIMAL(12,2) DEFAULT 0.00,
    frequency INT DEFAULT 1,
    is_deleted TINYINT DEFAULT 0,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 9. 战术广播日志
CREATE TABLE IF NOT EXISTS broadcasts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    content TEXT,
    sender_id INT,
    target_dept_id INT,
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (target_dept_id) REFERENCES departments(id)
) ENGINE=InnoDB;

-- 10. 语音预警协议表
CREATE TABLE IF NOT EXISTS voice_protocols (
    id INT PRIMARY KEY AUTO_INCREMENT,
    min_level INT DEFAULT 1,
    max_level INT DEFAULT 10,
    protocol_name VARCHAR(50),
    voice_text TEXT,
    is_active TINYINT DEFAULT 1,
    is_deleted TINYINT DEFAULT 0
) ENGINE=InnoDB;

-- 11. 全局合规审计日志
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    operator VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target VARCHAR(100),
    details TEXT,
    is_deleted TINYINT DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 12. AI 效能统计表
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action_type ENUM('OPTIMIZE', 'SUMMARIZE'),
    chars_processed INT,
    estimated_time_saved INT,
    is_deleted TINYINT DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 13. 系统通知中心表
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(50) DEFAULT 'INFO',
    is_read TINYINT DEFAULT 0,
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==========================================
-- 初始数据填充
-- ==========================================

-- 部门
INSERT IGNORE INTO departments (name) VALUES ('总经办'), ('销售一部'), ('技术部');

-- 等级体系
INSERT IGNORE INTO rank_config (rank_name, display_name, min_days, min_volume, min_ai_adoption, icon_tag) VALUES 
('NOVICE', '实战学员', 0, 0, 0, 'medal-bronze'),
('VETERAN', '资深老兵', 3, 50, 20, 'medal-silver'),
('ELITE', '战术精英', 7, 200, 100, 'medal-gold'),
('MASTER', '首席指挥官', 30, 1000, 500, 'crown');

-- 知识库
INSERT IGNORE INTO knowledge_base (keyword, answer, category) VALUES 
('发货', '标准回复：48小时内顺丰发出。话术：亲，您的宝贝已进入优先发货链路。', '物流'),
('便宜', '标准回复：强调价值而非价格。话术：亲，一分价钱一分货，我们采用的是...项目...', '商务');

-- 语音协议
INSERT IGNORE INTO voice_protocols (min_level, max_level, protocol_name, voice_text) 
VALUES (8, 10, '红色特级警报', '警报，检测到严重违规行为，取证系统已实时锁定证据，请立即纠正。');
INSERT IGNORE INTO voice_protocols (min_level, max_level, protocol_name, voice_text) 
VALUES (5, 7, '橙色中级提醒', '提醒，当前对话存在合规风险，建议参考智脑纠偏建议。');

-- 默认账号: admin / admin
INSERT IGNORE INTO users (username, password_hash, salt, real_name, role, department_id) 
VALUES ('admin', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'salt123', '超级管理员', 'HQ', 1);

-- 14. 菜单配置表
CREATE TABLE IF NOT EXISTS menu_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    path VARCHAR(100) NOT NULL,
    icon_name VARCHAR(50),
    min_role VARCHAR(20) DEFAULT 'ADMIN',
    is_deleted TINYINT DEFAULT 0,
    UNIQUE INDEX idx_path (path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. 权限功能定义表
CREATE TABLE IF NOT EXISTS permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE, -- 如 'user:delete', 'command:lock'
    name VARCHAR(100) NOT NULL,
    module VARCHAR(50), -- 所属模块
    is_deleted TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. 角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role VARCHAR(20) NOT NULL,
    permission_code VARCHAR(50) NOT NULL,
    FOREIGN KEY (permission_code) REFERENCES permissions(code),
    UNIQUE INDEX idx_role_perm (role, permission_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 注册初始战术模块
INSERT IGNORE INTO menu_config (name, path, icon_name, min_role) VALUES 
('战术指挥台', '/command', 'Zap', 'ADMIN'),
('部门架构', '/departments', 'Building2', 'HQ'),
('成员矩阵', '/users', 'UserCog', 'HQ'),
('权限中心', '/rbac', 'Shield', 'HQ');

-- 初始化基础权限点
INSERT IGNORE INTO permissions (code, name, module) VALUES 
('input:lock', '一键输入锁定', '实时指挥'),
('tactical:assist', '话术弹射协助', '实时指挥'),
('dept:manage', '组织架构管理', '后台管理'),
('user:manage', '操作员矩阵管理', '后台管理');

-- 默认权限分配：主管拥有指挥权限
INSERT IGNORE INTO role_permissions (role, permission_code) VALUES 
('ADMIN', 'input:lock'),
('ADMIN', 'tactical:assist');

