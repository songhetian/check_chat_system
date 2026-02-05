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
    
    new_perms = [
        {'code': 'agent:action:side_panel', 'name': '侧边面板控制', 'module': '实战交互'},
        {'code': 'agent:view:customer_insight', 'name': '深度客户洞察', 'module': '实战支撑'},
        {'code': 'agent:alert:attitude', 'name': '态度风险预警', 'module': '风险感知'}
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
            
        await RolePermission.get_or_create(role_id=1, permission_code=p_data['code'])
        await RolePermission.get_or_create(role_id=3, permission_code=p_data['code'])
    
    print("✅ [权限系统] 交互与感知类权限 (侧边栏/客户洞察/预警) 已同步")
    await Tortoise.close_connections()

if __name__ == "__main__":
    run_async(run_migration())
