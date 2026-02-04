import pymysql
import os

def fix_rbac_encoding():
    try:
        # 使用之前提取到的凭据
        conn = pymysql.connect(
            host='192.168.2.184',
            user='tian',
            password='tian@123456',
            database='smart_cs',
            charset='utf8mb4'
        )
        cursor = conn.cursor()
        
        print("🛠️  正在通过 Python 链路修复 RBAC 权限名乱码...")
        
        sql = "UPDATE permissions SET name = %s, module = %s WHERE code = %s"
        cursor.execute(sql, ('违规风险处置', '风险拦截', 'admin:violation:resolve'))
        
        conn.commit()
        print("✅ 修复完成！")
        
        # 再次验证
        cursor.execute("SELECT code, name, module FROM permissions WHERE code = 'admin:violation:resolve'")
        res = cursor.fetchone()
        print(f"🔍 验证结果: {res}")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ 修复失败: {e}")

if __name__ == "__main__":
    fix_rbac_encoding()
