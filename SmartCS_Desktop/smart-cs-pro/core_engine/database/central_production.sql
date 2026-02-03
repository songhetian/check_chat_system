-- [Smart-CS Pro] 中央指挥部 MySQL 数据库初始化脚本 - 工业级正式版
-- 修复：将角色存储逻辑重构为 ID 关联模式

CREATE DATABASE IF NOT EXISTS smart_cs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_cs;

-- 1. 系统角色表 (实现 ID 关联管理)
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE, -- 如 '坐席', '主管', '总部'
    code VARCHAR(20) NOT NULL UNIQUE, -- 如 'AGENT', 'ADMIN', 'HQ'
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. 部门表
CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    parent_id INT DEFAULT 0,
    manager_id INT, -- 部门主管 ID (关联 users.id)
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    salt VARCHAR(32) NOT NULL,
    real_name VARCHAR(50),
    role_id INT NOT NULL, -- 强制使用角色 ID 关联
    department_id INT,
    authorized_device_id VARCHAR(100),
    status TINYINT DEFAULT 1,
    is_deleted TINYINT DEFAULT 0,
    streak_days INT DEFAULT 0,
    handled_customers_count INT DEFAULT 0,
    ai_adoption_count INT DEFAULT 0,
    tactical_score INT DEFAULT 0,
    rank_level VARCHAR(20) DEFAULT 'NOVICE',
    graduated_at TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    INDEX idx_user (username)
) ENGINE=InnoDB;

-- 为部门表补齐主管外键 (需在 users 表之后执行)
ALTER TABLE departments ADD CONSTRAINT fk_dept_manager FOREIGN KEY (manager_id) REFERENCES users(id);

-- 4. 战术等级配置表
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

-- 5. 智能带教知识库
CREATE TABLE IF NOT EXISTS knowledge_base (
    id INT PRIMARY KEY AUTO_INCREMENT,
    keyword VARCHAR(100) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50),
    is_active TINYINT DEFAULT 1,
    is_deleted TINYINT DEFAULT 0
) ENGINE=InnoDB;

-- 6. 硬件设备白名单
CREATE TABLE IF NOT EXISTS devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hwid VARCHAR(100) NOT NULL UNIQUE,
    user_id INT,
    status ENUM('PENDING', 'APPROVED', 'BLOCKED') DEFAULT 'PENDING',
    device_info TEXT,
    is_deleted TINYINT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 7. 敏感词库
CREATE TABLE IF NOT EXISTS sensitive_words (
    id INT PRIMARY KEY AUTO_INCREMENT,
    word VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    risk_level INT DEFAULT 5,
    is_active TINYINT DEFAULT 1,
    is_deleted TINYINT DEFAULT 0
) ENGINE=InnoDB;

-- 8. 违规取证记录
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

-- 9. 全景客户画像
CREATE TABLE IF NOT EXISTS customers (
    name VARCHAR(100) PRIMARY KEY,
    level VARCHAR(20) DEFAULT 'NEW',
    tags TEXT,
    ltv DECIMAL(12,2) DEFAULT 0.00,
    frequency INT DEFAULT 1,
    is_deleted TINYINT DEFAULT 0,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 10. 战术广播日志
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

-- 11. 语音预警协议表
CREATE TABLE IF NOT EXISTS voice_protocols (
    id INT PRIMARY KEY AUTO_INCREMENT,
    min_level INT DEFAULT 1,
    max_level INT DEFAULT 10,
    protocol_name VARCHAR(50),
    voice_text TEXT,
    is_active TINYINT DEFAULT 1,
    is_deleted TINYINT DEFAULT 0
) ENGINE=InnoDB;

-- 12. 全局合规审计日志
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    operator VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target VARCHAR(100),
    details TEXT,
    is_deleted TINYINT DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 13. AI 效能统计表
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

-- 14. 系统通知中心表
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(50) DEFAULT 'INFO',
    is_read TINYINT DEFAULT 0,
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 15. 菜单配置表 (RBAC 核心)
CREATE TABLE IF NOT EXISTS menu_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    path VARCHAR(100) NOT NULL,
    icon_name VARCHAR(50),
    min_role_id INT DEFAULT 2, -- 关联角色 ID
    is_deleted TINYINT DEFAULT 0,
    UNIQUE INDEX idx_path (path),
    FOREIGN KEY (min_role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. 权限功能定义表
CREATE TABLE IF NOT EXISTS permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    module VARCHAR(50),
    is_deleted TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. 角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL, -- 关联角色 ID
    permission_code VARCHAR(50) NOT NULL,
    FOREIGN KEY (permission_code) REFERENCES permissions(code),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    UNIQUE INDEX idx_role_perm (role_id, permission_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 初始数据填充
-- ==========================================

-- 注入核心角色
INSERT IGNORE INTO roles (id, name, code) VALUES 
(1, '坐席', 'AGENT'),
(2, '主管', 'ADMIN'),
(3, '总部', 'HQ');

-- 注入默认部门
INSERT IGNORE INTO departments (name) VALUES ('总经办'), ('销售一部'), ('技术部');

-- 注入超级管理员 (初始 role_id=3)
INSERT IGNORE INTO users (username, password_hash, salt, real_name, role_id, department_id) 
VALUES ('admin', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'salt123', '超级管理员', 3, 1);

-- 注册初始战术模块 (绑定 role_id)
INSERT IGNORE INTO menu_config (name, path, icon_name, min_role_id) VALUES 
('战术指挥台', '/command', 'Zap', 2),
('组织架构', '/departments', 'Building2', 3),
('成员矩阵', '/users', 'UserCog', 3),
('权责定义', '/rbac', 'Shield', 3),
('风险审计', '/alerts', 'ShieldAlert', 2),
('消息中枢', '/notifications', 'Bell', 1);

-- 注册全量功能权限点 (细粒度)
INSERT IGNORE INTO permissions (code, name, module) VALUES 
-- 实时指挥
('command:input:lock', '实时输入锁定', '实时指挥'),
('command:assist:push', '话术弹射协助', '实时指挥'),
('command:voice:alert', '强制语音告警', '实时指挥'),
-- 风险拦截
('audit:violation:view', '违规详单查看', '风险拦截'),
('audit:evidence:export', '证据包导出', '风险拦截'),
-- 后台管理
('admin:dept:manage', '部门增删改查', '组织架构'),
('admin:user:manage', '操作员矩阵管理', '成员权限'),
('admin:rbac:config', '权责矩阵定义', '权限中心'),
-- 系统工具
('tool:secure_img:gen', '安全图片生成', '全域提效');

-- 预配主管(ADMIN)权限：赋予核心指挥与审计权
INSERT IGNORE INTO role_permissions (role_id, permission_code) VALUES 
(2, 'command:input:lock'),
(2, 'command:assist:push'),
(2, 'command:voice:alert'),
(2, 'audit:violation:view');

-- 预配总部(HQ)权限：赋予全量权限
INSERT IGNORE INTO role_permissions (role_id, permission_code) 
SELECT 3, code FROM permissions;