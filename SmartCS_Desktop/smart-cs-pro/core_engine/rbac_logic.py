# --- 工业级 RBAC 与权限热同步模块 ---

@app.post("/api/hq/user/update-role")
async def update_user_role(data: dict):
    """
    [HQ 专用] 动态调整用户角色并强制触发端侧重载
    """
    target_username = data.get("username")
    new_role = data.get("new_role") # 'AGENT', 'ADMIN', 'HQ'
    operator = data.get("operator")
    
    try:
        conn = get_db_conn()
        with conn.cursor() as cursor:
            # 1. 更新数据库
            cursor.execute("UPDATE users SET role = %s WHERE username = %s", (new_role, target_username))
            
            # 2. 记录高危审计
            audit_manager.log_action(operator, "CHANGE_ROLE", target_username, f"权限变更为: {new_role}")
            
            # 3. 关键：通过 Redis/WebSocket 实时驱逐旧会话
            # 找到该用户的所有活跃连接并发送通知
            await broadcast_event({
                "type": "ROLE_CHANGED",
                "target_user": target_username,
                "message": f"您的系统角色已调整为 {new_role}，请重新初始化链路。"
            })
            
            conn.commit(); conn.close()
            return {"status": "ok", "message": "角色调整成功，指令已下发"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 在 broadcast_event 中优化，支持针对特定用户的精准推送
async def broadcast_event(data):
    for conn in active_connections:
        try:
            # 如果是角色变更，所有端都会收到，前端根据 username 自行过滤
            await conn.send_text(json.dumps(data))
        except: pass
