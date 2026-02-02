# Smart-CS Pro UI 设计与组件规范

## 1. 核心视觉风格 (Visual Identity)
- **配色方案**: 
  - 背景: `slate-950` (登录/暗色模式), `slate-50` (管理后台背景)
  - 主色: `cyan-500` / `cyan-600` (战术科技感)
  - 警报: `red-600` (紧急拦截)
  - 成功/表扬: `amber-400` / `amber-500` (奖杯/烟花)
- **圆角规范**: 
  - 大容器 (Card/Modal): `rounded-[32px]`
  - 小工具/按钮: `rounded-2xl` 或 `rounded-xl`
- **玻璃拟态 (Glassmorphism)**: 
  - 类名: `.glass`
  - 样式: `bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl`

## 2. 常用 Tailwind 模式
- **战术胶囊 (Tactical Island)**: `fixed top-4 left-1/2 -translate-x-1/2`
- **侧边 HUD**: `fixed right-6 top-1/2 -translate-y-1/2 w-72`
- **状态动画**: 使用 `framer-motion` 的 `AnimatePresence` 处理弹窗的 `initial={{ opacity: 0, scale: 0.8 }}`。

## 3. 图标库 (Lucide React)
- 风险/拦截: `AlertTriangle`, `ShieldAlert`
- 工具/物料: `Package`, `Wrench`, `Zap`
- 客户/画像: `UserCircle2`, `TrendingUp`
