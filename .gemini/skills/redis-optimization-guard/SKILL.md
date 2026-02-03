---
name: redis-optimization-guard
description: Redis 缓存与性能优化工具。当执行数据获取、高频查询或需要实时事件推送时使用。确保通过 Redis 降低数据库负载并提升系统响应速度。
---

# Redis Optimization Guard

## 核心原则

在处理大量数据或高频请求时，必须优先考虑 Redis 优化以实现“增效”。

### 1. 缓存优先策略
*   **高频读操作**：对于变动频率低但查询频率高的接口（如配置信息、部门列表），必须实施 Redis 缓存。
*   **TTL 规范**：所有缓存必须设置合理的过期时间（TTL），防止内存泄露和数据陈旧。
*   **按需加载**：优先从 Redis 获取，命中失败后再查询 DB 并回写 Redis。

### 2. 实时性与信号同步
*   **Pub/Sub**：对于需要跨进程同步的操作（如违规通知、角色变更），使用 Redis 的发布/订阅机制。
*   **状态维护**：使用 Redis 维护在线状态、实时风险评分等瞬态数据。

### 3. 原子计数与限流
*   对于高并发下的计数操作（如接待量、错误重试），使用 Redis 的原子性操作（`INCR`, `DECR`）。

## 操作指南

### 场景 A：优化数据获取接口
1.  **评估必要性**：检查该接口是否在 1 秒内被重复调用，或者 DB 查询耗时是否超过 50ms。
2.  **实施缓存**：
    *   使用 `json.dumps()` 序列化对象存入 Redis。
    *   使用 `request.app.state.redis` 访问客户端。
3.  **一致性处理**：在对应的写入接口（如更新数据）中，必须同步删除或更新 Redis 中的缓存键（Cache Invalidation）。

### 场景 B：提升实时响应
1.  **异步通知**：在高危操作完成后，立即向 Redis 频道发送信号。
2.  **前端联动**：确保前端可以通过 WebSocket 或轮询快速捕获到 Redis 状态的变化。

## 示例 (代码规范)

**缓存模式 (api/config.py):**
```python
@router.get("/info")
async def get_info(request: Request):
    redis = request.app.state.redis
    # 1. 尝试从缓存读取
    cached = await redis.get("sys_info")
    if cached:
        return json.loads(cached)
    
    # 2. 缓存未命中，查库
    data = await ConfigModel.all().values()
    
    # 3. 回写缓存并设置 5 分钟过期
    await redis.setex("sys_info", 300, json.dumps(data))
    return data
```

**缓存失效模式 (api/config.py):**
```python
@router.post("/update")
async def update_info(data: dict, request: Request):
    await ConfigModel.create(**data)
    # 关键：更新数据后必须清除缓存
    await request.app.state.redis.delete("sys_info")
    return {"status": "ok"}
```