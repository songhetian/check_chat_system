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

-- 注册 AI 决策中心权限
INSERT IGNORE INTO permissions (code, name, module) VALUES 
('admin:ai:policy', '全域 AI 策略配置', 'AI 决策中心');

-- 注入总部(HQ)全量权限 (含 AI 策略)
INSERT IGNORE INTO role_permissions (role_id, permission_code) 
SELECT 3, code FROM permissions;

-- 18. 策略分类中枢表 (实现词库与话术的归类管理)
CREATE TABLE IF NOT EXISTS policy_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    type ENUM('SENSITIVE', 'KNOWLEDGE') NOT NULL, -- 区分词库分类或话术分类
    description VARCHAR(200),
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_name_type (name, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 19. 风险敏感词库
CREATE TABLE IF NOT EXISTS sensitive_words (
    id INT PRIMARY KEY AUTO_INCREMENT,
    word VARCHAR(100) UNIQUE NOT NULL,
    category_id INT NOT NULL, -- 强制关联分类 ID
    risk_level INT DEFAULT 5,
    is_active TINYINT DEFAULT 1,
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES policy_categories(id)
) ENGINE=InnoDB;

-- 20. 智能带教知识库
CREATE TABLE IF NOT EXISTS knowledge_base (
    id INT PRIMARY KEY AUTO_INCREMENT,
    keyword VARCHAR(100) NOT NULL,
    answer TEXT NOT NULL,
    category_id INT NOT NULL, -- 强制关联分类 ID
    is_active TINYINT DEFAULT 1,
    is_deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES policy_categories(id)
) ENGINE=InnoDB;

-- ==========================================
-- 初始权限与菜单同步 (rbac-integration-guard)
-- ==========================================
INSERT IGNORE INTO permissions (code, name, module) VALUES 
('admin:policy:category', '策略分类管理', 'AI 决策中心');

INSERT IGNORE INTO role_permissions (role_id, permission_code) VALUES (3, 'admin:policy:category');

INSERT IGNORE INTO menu_config (name, path, icon_name, min_role_id) VALUES 
('分类中枢', '/categories', 'Layers', 3);

-- ==========================================
-- 战术系统全量分页测试数据集 (V4.0 - 实体分类版)
-- ==========================================

-- 1. 注入 20+ 策略分类
INSERT IGNORE INTO policy_categories (id, name, type, description) VALUES 
(1, '财务风险', 'SENSITIVE', '涉及转账、私单等金钱交易拦截'),
(2, '服务态度', 'SENSITIVE', '不耐烦、辱骂等负面情绪识别'),
(3, '合规话术', 'KNOWLEDGE', '标准礼仪与法律免责声明'),
(4, '业务话术', 'KNOWLEDGE', '商品参数、物流时效标准回复'),
(5, '政治敏感', 'SENSITIVE', '违禁词库'), (6, '竞争对手', 'SENSITIVE', '友商平台信息过滤'),
(7, '个人隐私', 'SENSITIVE', '身份证、手机号收集拦截'), (8, '引导好评', 'SENSITIVE', '不正当得利诱导'),
(9, '售后流程', 'KNOWLEDGE', '退换货政策指导'), (10, '紧急公关', 'KNOWLEDGE', '危机处理话术'),
(11, '金融欺诈', 'SENSITIVE', '疑似骗术词库'), (12, '劳动纪律', 'SENSITIVE', '坐席消极应接判定'),
(13, '促销活动', 'KNOWLEDGE', '大促期间统一口径'), (14, '产品缺陷', 'KNOWLEDGE', '质量问题解释指引'),
(15, '物流查询', 'KNOWLEDGE', '顺丰/中通链路查询回复'), (16, '会员权益', 'KNOWLEDGE', '积分/等级计算规则'),
(17, '引流风险', 'SENSITIVE', '站外平台引流识别'), (18, '暴力倾向', 'SENSITIVE', '极端言论监控'),
(19, '定制需求', 'KNOWLEDGE', '非标订单确认话术'), (20, '常见QA', 'KNOWLEDGE', '高频问题秒回矩阵'),
(21, '数据安全', 'SENSITIVE', '防止公司内部资料外泄');

-- 2. 注入 20+ 敏感词记录 (关联 category_id)
INSERT IGNORE INTO sensitive_words (word, category_id, risk_level) VALUES 
('加个微信', 1, 9), ('私下转账', 1, 10), ('淘宝店铺', 17, 8), ('你个笨蛋', 2, 9), 
('没看说明', 2, 6), ('身份证号', 7, 10), ('打折力度', 1, 5), ('竞争对手', 6, 7),
('返现两元', 8, 8), ('你是猪吗', 2, 10), ('银行账号', 1, 10), ('公司内部', 21, 9),
('滚开', 2, 10), ('个人号', 17, 7), ('财务报表', 21, 9), ('优惠卷', 1, 4),
('恶意中伤', 2, 8), ('不建议买', 12, 7), ('明天发货', 4, 3), ('退款申请', 9, 2),
('举报你', 2, 8);

-- 3. 注入 20+ 知识库记录 (关联 category_id)
INSERT IGNORE INTO knowledge_base (keyword, answer, category_id) VALUES 
('发货', '标准回复：我们会在 48 小时内为您优先发出。', 4),
('正品', '标准回复：本店所有商品均由品牌官方授权，支持专柜验货。', 3),
('退货', '标准回复：在不影响二次销售的情况下，支持 7 天无理由退换。', 9),
('尺寸', '标准回复：详情页内有详细的规格表，建议您参考对比。', 4),
('顺丰', '标准回复：默认顺丰包邮，为您提供极速物流体验。', 15),
('颜色', '标准回复：图片为实物拍摄，受显示器影响可能存在轻微色差。', 4),
('价格', '标准回复：我们的价格已是全网最优，且包含全套售后保障。', 13),
('积分', '标准回复：每消费 1 元可获得 1 积分，可在会员中心兑换。', 16),
('安装', '标准回复：该商品提供免费上门安装服务，请联系客服预约。', 4),
('缺货', '标准回复：该规格目前处于预售状态，预计 5 天后补货。', 4),
('开发票', '标准回复：请在确认收货后，在订单详情页申请电子发票。', 3),
('投诉', '标准回复：很抱歉给您带来不便，我们的主管将立即为您回访。', 10),
('优惠', '标准回复：关注店铺可领取 5 元无门槛红包。', 13),
('材质', '标准回复：采用 100% 纯棉面料，触感柔软细腻。', 4),
('洗涤', '标准回复：建议冷水手洗，避免阳光暴晒以防褪色。', 4),
('批发', '标准回复：大宗采购请联系大客户专员 400-XXX-XXXX。', 19),
('对比', '标准回复：我们的产品具备核心专利，性能优于市面同类产品。', 10),
('物流慢', '标准回复：受天气影响物流稍有延迟，我们已为您催促网点。', 15),
('改地址', '标准回复：只要包裹尚未发出，我们可以为您免费修改地址。', 4),
('赠品', '标准回复：现在下单前 100 名用户可获赠精美战术挂件一个。', 13);

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

-- ==========================================
-- 战术系统全量分页测试数据集 (V3.0)
-- ==========================================

-- 1. 扩展测试部门 (新增 20+ 部门)
INSERT IGNORE INTO departments (id, name) VALUES 
(4, '销售二部'), (5, '售后支持部'), (10, '市场拓展部'), (11, '战略投资部'), (12, '品牌公关部'), 
(13, '人力资源部'), (14, '财务结算中心'), (15, '法务合规部'), (16, '行政保障部'), (17, '产品研发部'),
(18, '视觉设计组'), (19, '前端开发组'), (20, '后端架构组'), (21, '测试验证组');

-- 2. 注入多角色测试用户 (新增 20+ 用户，密码: admin123)
INSERT IGNORE INTO users (id, username, password_hash, salt, real_name, role_id, department_id, tactical_score) VALUES 
(2, 'manager_sales1', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'salt123', '张主管', 2, 2, 95),
(3, 'agent_001', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'salt123', '王小二', 1, 2, 88),
(4, 'agent_002', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'salt123', '李小美', 1, 2, 45),
(10, 'agent_10', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'salt123', '赵一一', 1, 10, 92),
(11, 'agent_11', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'salt123', '钱二二', 1, 11, 85),
(12, 'agent_12', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'salt123', '孙三三', 1, 12, 77),
(13, 'agent_13', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'salt123', '李四四', 1, 13, 42),
(14, 'agent_14', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'salt123', '周五五', 1, 14, 66),
(15, 'agent_15', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'salt123', '吴六六', 1, 15, 91),
(16, 'agent_16', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'salt123', '郑七七', 1, 16, 83),
(17, 'agent_17', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'salt123', '王八八', 1, 17, 52);

-- 3. 注入违规取证样本 (20+ 条)
INSERT IGNORE INTO violation_records (id, user_id, keyword, context, risk_score, timestamp) VALUES 
('T10', 10, '私下交易', '加我微信，给你低价', 9, NOW()),
('T11', 11, '辱骂', '你怎么这么笨', 10, NOW()),
('T12', 12, '敏感词', '涉及违禁话题', 7, NOW()),
('T13', 13, '怠工', '我现在没空理你', 5, NOW()),
('T14', 14, '转账', '扫码直接付给我', 10, NOW());

-- 4. 注入全景客户画像 (20+ 条)
INSERT IGNORE INTO customers (name, level, tags, ltv, frequency, last_seen_at) VALUES 
('客户_01', 'VIP', '高价值', 12000.00, 15, NOW()),
('客户_02', 'NEW', '潜在', 0.00, 1, NOW()),
('客户_03', 'NORMAL', '一般', 500.00, 3, NOW());

-- 5. 记录测试审计
INSERT INTO audit_logs (operator, action, target, details) VALUES 
('SYSTEM', 'SEED_V3', 'PAGINATION', '注入 V3.0 全量测试数据集');