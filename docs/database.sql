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
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
