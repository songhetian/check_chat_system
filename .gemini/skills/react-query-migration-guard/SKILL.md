---
name: react-query-migration-guard
description: 强制执行 React Query 迁移策略与 WebSocket 实时化改造。涵盖新增功能、Bug修复、功能迭代及轮询清理四个核心场景。
---

# React Query 迁移与实时化最高准则 (V4.1 零轮询版)

> ⚠️ **最高优先级指令 (PRIORITY: MAXIMUM)**: 
> 在进行任何涉及数据拉取、状态同步或实时通信的开发时，**必须** 优先遵循本 Skill 的规范。

## 1. 架构进化红线 (The Red Line)
1. **禁止使用 useEffect 获取数据**: 
   - 凡是 GET 请求、数据初始化或状态同步，**必须** 物理卸载 `useEffect`，全量改用 `useQuery`。
   - **例外许可**: 允许使用 `useEffect` 进行 **非数据类系统级副作用**，例如 `window.addEventListener` (键盘/全局事件监听) 或 WebSocket 基础连接挂载。
2. **绝对禁止 setInterval 轮询 (Zero Polling Policy)**: 
   - **禁止** 使用 `setInterval` 来同步后端数据、检查服务器状态或刷新界面。
   - 物理状态监控（如在线状态、报警）必须由 **WebSocket (useRiskSocket)** 驱动。
   - 准实时列表刷新必须由 `useQuery` 的 `refetchInterval` 接管。
   - **违规判定**: 只要代码中出现用于数据同步的 `setInterval`，即判定为架构漏洞，必须立即重构。
3. **强制 Auto-Commit**: 完成 React Query 迁移并校验通过后，必须立即执行 Git 提交。

## 2. 核心迁移策略 (Refactor on Touch)
只要你的光标触碰到了某个旧页面，哪怕只是为了改一个 CSS 类，你也 **必须顺便完成** 该页面的 React Query 迁移。


## 2. 代码模式对比 (Pattern Enforcement)

### ❌ 禁止 (Legacy Pattern)
```tsx
// 严禁在新代码中出现
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    const res = await api.get('/list'); // ❌ 手动请求
    setData(res);
    setLoading(false);
  };
  fetchData();
  
  const timer = setInterval(fetchData, 5000); // ❌ 手动轮询
  return () => clearInterval(timer);
}, []);
```

### ✅ 推荐 (Modern Pattern)
```tsx
// ⭕️ 准实时场景
const { data, isLoading } = useQuery({
  queryKey: ['list'],
  queryFn: () => api.get('/list'),
  refetchInterval: 5000, // ✅ 智能轮询
});

// ⚡️ 实时推送场景
useRiskSocket({
  onEvent: (event) => {
    if (event.type === 'UPDATE') {
      queryClient.invalidateQueries({ queryKey: ['list'] }); // ✅ 推送触发刷新
    }
  }
});
```

## 3. 执行检查清单
在提交代码前，请自问：
1. 本次修改是否引入了新的 `useEffect` 用于数据获取？(如果是 -> 改用 React Query)
2. 本次修改的页面是否包含旧的 `setInterval`？(如果是 -> 拆解为 WebSocket 或 refetchInterval)
3. 这是一个新功能吗？(如果是 -> 必须全量 React Query)
