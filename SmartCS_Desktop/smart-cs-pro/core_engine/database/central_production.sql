-- [Smart-CS Pro] 中央指挥部 MySQL 数据库初始化脚本 - V3.0 原子权责版
-- 强制执行：4-tier CRUD 权责模型固化

CREATE DATABASE IF NOT EXISTS smart_cs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_cs;

-- 1. 系统角色表
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. 部门表
CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    manager_id INT,
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
    role_id INT NOT NULL,
    department_id INT,
    status TINYINT DEFAULT 1,
    is_deleted TINYINT DEFAULT 0,
    tactical_score INT DEFAULT 100,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- 4. 权限功能定义表 (原子级)
CREATE TABLE IF NOT EXISTS permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    module VARCHAR(50),
    is_deleted TINYINT DEFAULT 0
) ENGINE=InnoDB;

-- 5. 角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    permission_code VARCHAR(50) NOT NULL,
    is_deleted TINYINT DEFAULT 0,
    FOREIGN KEY (permission_code) REFERENCES permissions(code),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    UNIQUE INDEX idx_role_perm (role_id, permission_code)
) ENGINE=InnoDB;

-- 6. 全局合规审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    operator VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target VARCHAR(100),
    details TEXT,
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 7. 策略分类中枢表
CREATE TABLE IF NOT EXISTS policy_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL,
    description VARCHAR(200),
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 8. 敏感词库
CREATE TABLE IF NOT EXISTS sensitive_words (
    id INT PRIMARY KEY AUTO_INCREMENT,
    word VARCHAR(100) UNIQUE NOT NULL,
    category_id INT NOT NULL,
    risk_level INT DEFAULT 5,
    is_active TINYINT DEFAULT 1,
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES policy_categories(id)
) ENGINE=InnoDB;

-- 9. 智能带教知识库
CREATE TABLE IF NOT EXISTS knowledge_base (
    id INT PRIMARY KEY AUTO_INCREMENT,
    keyword VARCHAR(100) NOT NULL,
    answer TEXT NOT NULL,
    category_id INT NOT NULL,
    is_active TINYINT DEFAULT 1,
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES policy_categories(id)
) ENGINE=InnoDB;

-- 10. 商品战术资产表
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    usp TEXT,
    stock INT DEFAULT 0,
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 11. 战术目标监控平台表
CREATE TABLE IF NOT EXISTS platforms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    keyword VARCHAR(50) NOT NULL UNIQUE,
    is_active TINYINT DEFAULT 1,
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 12. 系统通知中心
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(50) DEFAULT 'INFO',
    is_read TINYINT DEFAULT 0,
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 13. 违规取证记录
CREATE TABLE IF NOT EXISTS violation_records (
    id VARCHAR(50) PRIMARY KEY,
    user_id INT NOT NULL,
    keyword VARCHAR(100),
    context TEXT,
    risk_score INT,
    solution TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    screenshot_url TEXT,
    is_deleted TINYINT DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ==========================================
-- 初始数据填充
-- ==========================================

-- 核心角色
INSERT IGNORE INTO roles (id, name, code) VALUES (1, '坐席', 'AGENT'), (2, '主管', 'ADMIN'), (3, '总部', 'HQ');

-- 超级管理员 (Password: admin123)
INSERT IGNORE INTO users (username, password_hash, salt, real_name, role_id) 
VALUES ('admin', 'eeea7af566eaa1ec19871a5074808e5bd4df3e28644fab20e81ebfc69ca6bb8a', 'salt123', '超级管理员', 3);

-- 原子权限注册
INSERT IGNORE INTO permissions (code, name, module) VALUES 
('admin:dept:view', '部门列表查看', '组织架构'),
('admin:dept:create', '新部门录入', '组织架构'),
('admin:dept:update', '部门架构调整', '组织架构'),
('admin:dept:delete', '部门风险注销', '组织架构'),
('admin:user:view', '操作员矩阵查看', '成员权限'),
('admin:user:create', '新成员入驻', '成员权限'),
('admin:user:update', '成员权责重校', '成员权限'),
('admin:user:delete', '成员节点注销', '成员权限'),
('admin:cat:view', '策略分类查看', 'AI 决策中心'),
('admin:cat:create', '新分类定义', 'AI 决策中心'),
('admin:cat:update', '分类参数重校', 'AI 决策中心'),
('admin:cat:delete', '分类逻辑移除', 'AI 决策中心'),
('admin:ai:view', '全域策略查看', 'AI 决策中心'),
('admin:ai:create', '新策略布控', 'AI 决策中心'),
('admin:ai:update', '策略阈值调整', 'AI 决策中心'),
('admin:ai:delete', '策略节点清除', 'AI 决策中心'),
('admin:platform:view', '监控平台查看', '战术布控'),
('admin:platform:create', '监控平台新增', '战术布控'),
('admin:platform:update', '监控平台调整', '战术布控'),
('admin:platform:delete', '监控平台移除', '战术布控'),
('admin:asset:view', '商品资产查看', '战术布控'),
('admin:asset:create', '商品资产录入', '战术布控'),
('admin:asset:update', '商品资产修正', '战术布控'),
('admin:asset:delete', '商品资产注销', '战术布控'),
('admin:customer:view', '客户画像查看', '风险拦截'),
('admin:customer:export', '全量画像导出', '风险拦截'),
('command:input:lock', '物理输入锁定', '实时指挥'),
('command:push:script', '战术话术弹射', '实时指挥'),
('audit:log:view', '合规审计流查看', '风险拦截'),
('admin:violation:resolve', '违规风险处置', '风险拦截'),
('tool:secure:gen', '安全载荷生成', '全域提效'),
-- 坐席端行为权限
('agent:status:sync', '个人态势同步', '坐席实战'),
('agent:honor:view', '个人荣誉查看', '坐席实战'),
('agent:training:execute', '实战培训执行', '坐席实战'),
('agent:command:receive', '战术指令接收', '坐席实战'),
('agent:hud:view', '个人态势舱查看', '坐席实战'),
('agent:hud:export', '个人战术报表导出', '坐席实战');

-- 授权 HQ 全量权限
INSERT IGNORE INTO role_permissions (role_id, permission_code) 
SELECT 3, code FROM permissions;

-- 授权 坐席 基础实战权限
INSERT IGNORE INTO role_permissions (role_id, permission_code) VALUES 
(1, 'agent:status:sync'),
(1, 'agent:honor:view'),
(1, 'agent:training:execute'),
(1, 'agent:command:receive'),
(1, 'agent:hud:view');INSERT IGNORE INTO permissions (code, name, module) VALUES ('agent:view:big_screen', '实时大屏态势', '个人战术舱');
INSERT IGNORE INTO role_permissions (role_id, permission_code) VALUES (1, 'agent:view:big_screen'), (3, 'agent:view:big_screen');
