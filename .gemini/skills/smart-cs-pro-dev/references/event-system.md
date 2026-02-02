# Smart-CS Pro 实时事件与通信链路

## 1. WebSocket 协议 (ws://127.0.0.1:8000/ws/risk)
由 Python 核心引擎推送，前端 `useRiskSocket.ts` 监听并分发。

### 核心事件类型 (Event Types)
| 类型 | 描述 | 数据载荷 (Payload) | 前端行为 |
| :--- | :--- | :--- | :--- |
| `VIOLATION` | 敏感词命中 | `keyword`, `context`, `screenshot` | 弹出灵动岛提醒，记录到违规列表 |
| `RED_ALERT` | 严重违规 (如 315) | `keyword`, `context`, `screenshot` | 触发全屏红色闪烁 (Red Alert) |
| `PRAISE` | 主管表扬 | `message`, `agent_id` | 触发 `Fireworks.tsx` 烟花特效 |
| `SOP_GUIDE` | 战术指引推送 | `steps: string[]` | 侧边弹出 `SOPOverlay.tsx` |
| `PRODUCT_SUGGESTION` | 商品意向识别 | `products: any[]` | 底部弹出 `SuggestionPopup.tsx` |
| `trigger-customer` | 客户画像识别 | `detail: PersonaData` | 侧边弹出 `CustomerHUD.tsx` |

## 2. 前端事件总线 (Event Bus)
使用 `window.dispatchEvent` 和 `CustomEvent` 实现跨组件触发：
- `trigger-suggestion`: 显示商品建议。
- `trigger-fireworks`: 显示表扬烟花。
- `trigger-sop`: 显示 SOP 指引。
- `trigger-red-alert`: 激活全屏紧急状态。

## 3. Electron IPC 通道
- `open-big-screen`: 渲染进程请求将悬浮窗切换为管理大屏尺寸。
- `select-video-file`: 渲染进程请求 Electron 弹出系统文件选择框。
- `auth-success`: 登录成功后通知主进程调整窗口形态。
