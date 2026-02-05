import os
import asyncio
from tortoise import Tortoise, run_async
from dotenv import load_dotenv

async def run_migration():
    load_dotenv()
    # 确保路径正确指向 core.models
    await Tortoise.init(
        db_url=f"mysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}",
        modules={"models": ["core.models"]}
    )
    
    # 1. 注册权限
    from core.models import Permission, RolePermission
    p, created = await Permission.get_or_create(
        code='agent:view:big_screen',
        defaults={'name': '实时大屏态势', 'module': '个人战术舱'}
    )
    
    if not created:
        p.name = '实时大屏态势'
        p.module = '个人战术舱'
        await p.save()
    
    # 2. 授权 (1: 坐席, 3: 总部)
    await RolePermission.get_or_create(role_id=1, permission_code='agent:view:big_screen')
    await RolePermission.get_or_create(role_id=3, permission_code='agent:view:big_screen')
    
    print("✅ [权限系统] agent:view:big_screen 已同步至数据库")
    await Tortoise.close_connections()

if __name__ == "__main__":
    run_async(run_migration())
