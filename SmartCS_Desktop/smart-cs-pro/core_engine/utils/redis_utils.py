import os, json, logging, time, redis.asyncio as redis
from typing import Optional, Any

logger = logging.getLogger("SmartCS")

class RedisManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RedisManager, cls).__new__(cls)
            cls._instance.client = None
        return cls._instance

    async def connect(self):
        if not self.client:
            try:
                raw_password = os.getenv("REDIS_PASSWORD", None)
                # 转换空字符串或 "None" 字符串为真正的 None
                password = None
                if raw_password and raw_password.strip() and raw_password.lower() != "none":
                    password = raw_password.strip()

                self.client = redis.Redis(
                    host=os.getenv("REDIS_HOST", "127.0.0.1"),
                    port=int(os.getenv("REDIS_PORT", 6379)),
                    db=int(os.getenv("REDIS_DB", 0)),
                    password=password,
                    decode_responses=True,
                    socket_keepalive=True,
                    health_check_interval=30,
                    max_connections=20
                )
                await self.client.ping()
                logger.info("🚀 Redis Connection Pool Initialized")
            except Exception as e:
                logger.error(f"❌ Redis Connection Failed: {e}")
                self.client = None
        return self.client

    async def disconnect(self):
        if self.client:
            await self.client.close()
            self.client = None

    # --- 辅助方法：缓存操作 ---
    async def set_cache(self, key: str, value: Any, ttl: int = 300):
        if self.client:
            await self.client.setex(key, ttl, json.dumps(value))

    async def get_cache(self, key: str) -> Optional[Any]:
        if self.client:
            data = await self.client.get(key)
            return json.loads(data) if data else None
        return None

    # --- 辅助方法：在线坐席管理 (Set 模式) ---
    async def mark_online(self, username: str):
        if self.client:
            await self.client.sadd("online_agents_set", username)
            # 同时保留一个带 TTL 的 Key 用于自动下线探测 (可选)
            await self.client.setex(f"agent_heartbeat:{username}", 60, "1")

    async def mark_offline(self, username: str):
        if self.client:
            await self.client.srem("online_agents_set", username)
            await self.client.delete(f"agent_heartbeat:{username}")

    # --- 活跃度监控增强 ---
    async def update_activity(self, username: str):
        """记录最后一次物理动作 (鼠标/键盘)"""
        if self.client:
            # 记录时间戳，设置 24 小时自动过期
            await self.client.setex(f"last_activity:{username}", 86400, str(int(time.time())))

    async def get_last_activity(self, username: str) -> Optional[int]:
        """获取最后一次活动的时间戳"""
        if self.client:
            val = await self.client.get(f"last_activity:{username}")
            return int(val) if val else None
        return None

    async def get_online_list(self):
        if self.client:
            # 这里的优化：如果需要更精确，可以结合心跳 Key 过滤
            return await self.client.smembers("online_agents_set")
        return set()

redis_mgr = RedisManager()
