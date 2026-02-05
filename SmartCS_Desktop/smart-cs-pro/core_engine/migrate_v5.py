import os
import asyncio
from tortoise import Tortoise, run_async
from dotenv import load_dotenv

async def run_migration():
    load_dotenv()
    await Tortoise.init(
        db_url=f"mysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}",
        modules={"models": ["core.models"]}
    )
    
    from core.models import Permission, RolePermission
    
    # 1. 注册权限
    new_perms = [
        {'code': 'agent:view:products', 'name': '查看商品资产', 'module': '实战支撑'},
        {'code': 'agent:view:knowledge', 'name': '查阅战术知识', 'module': '实战支撑'},
        {'code': 'agent:view:customers', 'name': '分析客户画像', 'module': '实战支撑'}
    ]
    
    for p_data in new_perms:
        p, created = await Permission.get_or_create(
            code=p_data['code'],
            defaults={'name': p_data['name'], 'module': p_data['module']}
        )
        if not created:
            p.name = p_data['name']
            p.module = p_data['module']
            await p.save()
            
        # 授权 (1: 坐席, 3: 总部)
        await RolePermission.get_or_create(role_id=1, permission_code=p_data['code'])
        await RolePermission.get_or_create(role_id=3, permission_code=p_data['code'])
    
    print("✅ [权限系统] 支撑类权限 (商品/知识/客户) 已同步至数据库")
    await Tortoise.close_connections()

if __name__ == "__main__":
    run_async(run_migration())
