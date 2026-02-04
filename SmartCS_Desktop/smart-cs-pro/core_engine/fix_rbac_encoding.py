import pymysql

def fix_rbac_encoding():
    try:
        conn = pymysql.connect(
            host='192.168.2.184',
            user='tian',
            password='tian@123456',
            database='smart_cs',
            charset='utf8mb4'
        )
        cursor = conn.cursor()
        
        print("🛠️  正在通过 Python 链路修复个人态势舱权限名乱码...")
        
        updates = [
            ('个人态势舱查看', '坐席实战', 'agent:hud:view'),
            ('个人战术报表导出', '坐席实战', 'agent:hud:export')
        ]
        
        sql = "UPDATE permissions SET name = %s, module = %s WHERE code = %s"
        cursor.executemany(sql, updates)
        
        conn.commit()
        print("✅ 编码修复完成！")
        
        # 验证
        cursor.execute("SELECT code, name, module FROM permissions WHERE code LIKE 'agent:hud%'")
        rows = cursor.fetchall()
        for row in rows:
            print(f"🔍 确认: {row}")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ 修复失败: {e}")

if __name__ == "__main__":
    fix_rbac_encoding()
