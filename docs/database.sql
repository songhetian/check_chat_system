-- Smart CS System Database Schema

CREATE DATABASE IF NOT EXISTS smart_cs_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_cs_db;

-- 部门表
CREATE TABLE `departments` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '部门名称',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户表 (包含服务端管理员、主管、客服)
CREATE TABLE `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'supervisor', 'agent') NOT NULL,
  `dept_id` INT,
  `nickname` VARCHAR(50),
  `status` ENUM('online', 'busy', 'away', 'offline') DEFAULT 'offline',
  FOREIGN KEY (`dept_id`) REFERENCES `departments`(`id`)
);

-- 敏感词/监控词表
CREATE TABLE `words` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `word` VARCHAR(100) NOT NULL,
  `type` ENUM('sensitive', 'monitor') NOT NULL COMMENT 'sensitive:拦截删除, monitor:仅监控',
  `scope` ENUM('global', 'dept') NOT NULL,
  `dept_id` INT,
  FOREIGN KEY (`dept_id`) REFERENCES `departments`(`id`)
);

-- 快捷回复表 (增加文件支持)
CREATE TABLE `replies` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `content` TEXT NOT NULL,
  `category` VARCHAR(50),
  `file_url` VARCHAR(255) COMMENT '附件路径',
  `scope` ENUM('global', 'dept') NOT NULL,
  `dept_id` INT,
  FOREIGN KEY (`dept_id`) REFERENCES `departments`(`id`)
);

-- 系统操作日志 (审计谁动了系统)
CREATE TABLE `system_logs` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `operator_id` INT,
  `action` VARCHAR(255),
  `target` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`operator_id`) REFERENCES `users`(`id`)
);

-- 求助知识库 (沉淀主管的解决方案)
CREATE TABLE `help_knowledge` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `question` TEXT NOT NULL COMMENT '客服提出的问题',
  `solution` TEXT NOT NULL COMMENT '主管给出的方案',
  `screenshot_url` VARCHAR(255) COMMENT '求助时的截图证物',
  `dept_id` INT,
  `scope` ENUM('global', 'dept') DEFAULT 'dept' COMMENT '可见范围',
  `tags` VARCHAR(100) COMMENT '关键词标签',
  `click_count` INT DEFAULT 0 COMMENT '被查阅次数',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`dept_id`) REFERENCES `departments`(`id`)
);


-- 监控记录表
CREATE TABLE `monitor_logs` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `agent_id` INT,
  `triggered_word` VARCHAR(100),
  `full_content` TEXT,
  `action_taken` VARCHAR(50) COMMENT '如：已删除, 已记录',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`)
);

-- 备忘录/任务表
CREATE TABLE `memos` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT,
  `content` TEXT NOT NULL,
  `remind_at` DATETIME,
  `is_completed` BOOLEAN DEFAULT FALSE,
  `source` ENUM('self', 'supervisor') DEFAULT 'self',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
-- 插入初始部门
INSERT INTO `departments` (`name`) VALUES ('销售部'), ('售后部');

-- 插入初始用户 (密码暂存为明文，生产环境建议通过服务端加密)
-- 管理员
INSERT INTO `users` (`username`, `password`, `role`, `nickname`) 
VALUES ('admin', 'admin123', 'admin', '系统管理员');

-- 主管 (所属部门 ID = 1)
INSERT INTO `users` (`username`, `password`, `role`, `dept_id`, `nickname`) 
VALUES ('supervisor', 'super123', 'supervisor', 1, '销售主管');

-- 客服 (所属部门 ID = 1)
INSERT INTO `users` (`username`, `password`, `role`, `dept_id`, `nickname`) 
VALUES ('agent01', 'agent123', 'agent', 1, '客服小明');

