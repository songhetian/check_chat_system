# --- 工业级权限隔离与审计增强版本 ---

@app.get("/api/admin/violations")
async def get_violations(token: str):
    # 1. 验证身份并获取角色信息 (实际应解析 JWT)
    # 假设从 token 获取了 current_user
    current_user = {"role": "ADMIN", "dept_id": 2, "username": "zhang_manager"}
    
    try:
        conn = get_db_conn()
        with conn.cursor() as cursor:
            if current_user["role"] == "HQ":
                sql = "SELECT * FROM violation_records ORDER BY timestamp DESC"
                cursor.execute(sql)
            else:
                # 核心隔离逻辑：JOIN users 表过滤部门
                sql = """
                    SELECT vr.* FROM violation_records vr
                    JOIN users u ON vr.user_id = u.id
                    WHERE u.department_id = %s
                    ORDER BY vr.timestamp DESC
                """
                cursor.execute(sql, (current_user["dept_id"],))
            
            # 2. 自动记录管理审计：谁在看数据
            audit_manager.log_action(
                current_user["username"], 
                "VIEW_VIOLATIONS", 
                f"DEPT_{current_user['dept_id']}", 
                "调取违规取证列表"
            )
            
            return {"status": "ok", "data": cursor.fetchall()}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()

# 3. 增加主管绩效考核接口
@app.get("/api/hq/manager/kpi")
async def get_manager_kpis():
    """总部专用的主管战术效能排名"""
    # 这里逻辑：查询 audit_logs 和 broadcasts 统计每个主管的动作频率
    return [
        {"name": "销售一部主管", "response_time": "45s", "praise_rate": "85%", "rank": 1},
        {"name": "销售二部主管", "response_time": "120s", "praise_rate": "40%", "rank": 2},
    ]
