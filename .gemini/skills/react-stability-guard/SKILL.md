# React 稳定性守卫 (React Stability Guard)

**核心使命**：强制执行 React 组件的安全性检查，从根源上杜绝由于数据未加载（undefined）或标签不匹配（HTML/Motion）导致的运行时崩溃和构建错误。

## 1. 强制数据安全访问 (Data Safety)

严禁对可能为 `undefined` 或 `null` 的数据直接访问数组/对象方法或属性。**必须** 使用可选链 (`?.`) 和空值合并 (`||`) 进行防御性编程。

### ⛔️ 崩溃模式 (Crash Patterns)
*   **Bad**: `data.filter(...).length` -> 当 data 为 undefined 时崩溃。
*   **Bad**: `items.map(...)` -> 当 items 为 null 时崩溃。
*   **Bad**: `user.profile.name` -> 当 profile 未加载时崩溃。

### ✅ 稳定性模式 (Stability Patterns)
*   **Good**: `(data?.filter(...) || []).length` -> **强制对 .length 使用 () 包裹并提供默认值 []**。
*   **Good**: `(items || []).map(...)` -> **强制对 .map 使用默认值 []**。
*   **Good**: `user?.profile?.name || '未知'` -> **强制提供兜底值**。

## 2. Framer Motion 动画规范 (Animation Safety)

Framer Motion 组件必须严格遵守标签闭合规范，并正确处理 `AnimatePresence` 的挂载逻辑。

### ⛔️ 构建错误模式 (Build Error Patterns)
*   **Bad**: `<motion.div> ... </div>` -> **标签不匹配**，导致 Vite 构建失败。
*   **Bad**: `<AnimatePresence> <Component /> </AnimatePresence>` (无条件判断) -> 导致组件无法卸载或动画失效。

### ✅ 动画稳定性模式 (Animation Stability Patterns)
*   **Good**: `<motion.div> ... </motion.div>` -> **标签必须严格对称**。
*   **Good**: 
    ```tsx
    <AnimatePresence>
      {isOpen && (
        <motion.div key="modal" ... />
      )}
    </AnimatePresence>
    ```
    -> **必须使用条件渲染 (&&) 并提供唯一 key**。

## 3. 自查清单 (Self-Check Protocol)

在编写或修改 React 组件代码后，**必须** 执行以下自查：

1.  **[CRITICAL] 数组长度检查**：
    *   搜索代码中的 `.length`。
    *   确认其前方的变量是否已通过 `?.` 或 `|| []` 进行保护。
    *   **示例**: `const count = (list || []).length;`

2.  **[CRITICAL] 标签闭合检查**：
    *   检查所有 `motion.` 组件。
    *   确认 `<motion.div>` 对应的闭合标签是 `</motion.div>` 而不是 `</div>`。

3.  **[HIGH] 异步数据渲染**：
    *   确认所有从 API 获取的数据在渲染前都有默认值（如 `useState([])` 或 `data || []`）。
    *   在数据加载中（`isLoading`）时，**必须** 渲染 Loading 占位符，而不是尝试渲染空数据。
