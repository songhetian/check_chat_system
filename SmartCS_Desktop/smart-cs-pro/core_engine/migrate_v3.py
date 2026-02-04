import asyncio
import os
from dotenv import load_dotenv
from tortoise import Tortoise

async def run_migration():
    load_dotenv()
    db_url = f"mysql://{os.getenv('DB_USER', 'root')}:{os.getenv('DB_PASSWORD', '')}@{os.getenv('DB_HOST', '127.0.0.1')}:{os.getenv('DB_PORT', '3306')}/{os.getenv('DB_NAME', 'smart_cs')}"
    
    print(f"📡 正在连接数据库执行战术迁移: {db_url}")
    
    try:
        await Tortoise.init(db_url=db_url, modules={})
        conn = Tortoise.get_connection("default")
        
        # 1. 结构变更
        print("🛠️  正在热更新表结构...")
        queries = [
            "ALTER TABLE violation_records ADD COLUMN IF NOT EXISTS solution TEXT;",
            "ALTER TABLE violation_records ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING';",
            "ALTER TABLE violation_records ADD COLUMN IF NOT EXISTS screenshot_url TEXT;",
            # 2. 权限注册
            "INSERT IGNORE INTO permissions (code, name, module) VALUES ('admin:violation:resolve', '违规风险处置', '风险拦截');",
            # 3. 总部授权
            "INSERT IGNORE INTO role_permissions (role_id, permission_code) VALUES (3, 'admin:violation:resolve');"
        ]
        
        for q in queries:
            try:
                await conn.execute_script(q)
                print(f"  ✅ 执行成功: {q[:40]}...")
            except Exception as e:
                print(f"  ⚠️  跳过或已存在: {e}")
                
        print("\n🚀 [SQL 守卫] 数据库热更新完成！")
    finally:
        await Tortoise.close_connections()

if __name__ == "__main__":
    asyncio.run(run_migration())
