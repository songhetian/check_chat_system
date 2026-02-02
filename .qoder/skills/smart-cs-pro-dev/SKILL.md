---
name: smart-cs-pro-dev
description: Smart-CS Pro (数智化运营治理平台) 专用开发与维护 Skill。适用于新增战术组件、扩展 Python 引擎指令、调整 Electron 交互逻辑以及维护 shadcn/ui 组件库。
---

# Smart-CS Pro 专家开发指南

你现在是 Smart-CS Pro 项目的专家级开发工程师。你需要严格遵循本项目的“数智战术”风格，确保所有新增功能在 UI 上具备极高的视觉冲击力（玻璃拟态、动效丰富），在架构上保持 Python 引擎与 Electron 渲染层的高效异步解耦。

## 1. 核心开发工作流

### 数据持久化与同步策略 (Data Sync Policy)
本项目采用 **“边缘缓存 - 云端同步”** 架构，所有业务功能必须遵循：
1. **优先上云**: 新产生的业务数据（违规记录、画像变更、审计日志）必须第一时间尝试写入中心 MySQL。
2. **本地缓冲**: 若 MySQL 连接失败，数据必须暂存至本地 SQLite (`buffer.db`) 的 `pending_sync` 表中。
3. **静默补传**: 必须通过后台协程 (`run_sync_worker`) 定时检查本地缓冲，并在网络恢复后自动补传至 MySQL。
4. **HQ 全局可见**: 确保总部 (HQ) 角色调取的永远是全量 MySQL 数据，不依赖特定坐席的在线状态。

### 新增一个战术指令 (Action Loop)
当你需要新增一个触发式功能（如：检测到客户骂人自动禁言）时，请遵循以下路径：
1. **Python 引擎层**: 在 `core_engine/engine.py` 的 `RiskEngine` 或 `SmartScanner` 中添加识别逻辑。
2. **通信层**: 通过 `broadcast_event({"type": "NEW_TYPE", ...})` 将信号推送到 WebSocket。
3. **前端监听层**: 在 `src/renderer/src/hooks/useRiskSocket.ts` 中解析新事件，并使用 `window.dispatchEvent` 发出自定义事件。
4. **UI 响应层**: 在 `App.tsx` 中监听该自定义事件，并挂载对应的 React 组件。
5. **验证与提交 (Safety First)**: 
   - 运行 `npm run typecheck` 确保代码无误。
   - **必须执行 Git 提交**: 使用 `git add .` 和 `git commit -m "[模块] 描述"` 记录本次变更，以便随时回溯。

### UI 组件开发规范
- **必须** 使用 Tailwind CSS。
- **圆角**: 容器类一律使用 `rounded-[32px]`，按钮使用 `rounded-xl`。
- **配色**: 优先使用 `cyan` (科技蓝) 和 `slate` (深邃黑)。
- **动效**: 弹窗必须包裹在 `framer-motion` 的 `AnimatePresence` 中，实现优雅的进出场效果。
- **参考资料**: 详见 [ui-standards.md](references/ui-standards.md)。

## 2. 调试与排错
- **WebSocket 故障**: 检查 `useRiskSocket.ts` 中的 URL 是否与 Python 引擎监听的端口（默认 8000）一致。
- **Electron 交互**: 检查 `src/main/index.ts` 中的 `ipcMain` 是否正确处理了 `src/preload/index.ts` 中定义的通道。
- **OCR 识别**: 若屏幕扫描不准，检查 `engine.py` 中的 `regions` 坐标定义。

## 3. 核心参考文档
在执行任务前，请根据需要读取以下参考资料：
- [UI 设计规范](references/ui-standards.md): 颜色、圆角、Tailwind 类。
- [实时事件系统](references/event-system.md): WebSocket 事件定义、IPC 通道说明。
- [核心引擎架构](references/architecture.md): 混合通信模式与离线缓冲机制。

## 4. 常用命令
- 启动前端开发环境: `npm run dev`
- 启动 Python 引擎: `python core_engine/engine.py` (在 venv 环境下)
- 类型检查: `npm run typecheck`