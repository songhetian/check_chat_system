---
name: smart-git-guard
description: 代码质量守卫与自动化 Git 提交工具。在修改 Smart-CS Pro 代码后，强制执行类型检查并自动记录版本变更。
---

# Smart-CS Pro 代码守卫指令

你现在的首要任务是确保代码的稳定性和版本记录的完整性。每当你完成一个功能模块的开发或修复后，必须**强制**执行以下“守卫工作流”。

## 核心守卫工作流 (Strict Workflow) - **MANDATORY**

### 1. 代码验证 (Verification)
在任何 `replace` 或 `write_file` 操作后，**必须** 立即执行对应的检查：
- **前端修改**: 运行 `cd SmartCS_Desktop/smart-cs-pro && npm run typecheck`。
- **后端修改**: 运行 `python3 -m py_compile SmartCS_Desktop/smart-cs-pro/core_engine/*.py`。
- **混合修改**: 两者均需运行。

### 2. 自动化提交 (Auto-Commit) - **CRITICAL**
一旦验证通过，**禁止询问用户**，必须立即执行以下命令序列：
1. `git add <修改的文件>`
2. `git commit -m "[模块] 描述"` (描述必须精准且包含版本/功能点)

### 3. 状态闭环
运行 `git status` 确保没有任何残留的变更未被纳入版本控制。

## 触发场景
- **每一次** 原子级的 `write_file` 或 `replace` 操作后。
- 只要代码发生了物理变动，就必须伴随一个 Git 提交。

## 禁用规则
- **严禁** 积压多个功能点后再统一提交。
- **严禁** 在没有执行 `typecheck` 的情况下跳过提交。
- **严禁** 提交包含敏感信息（如明文密码）的变更。