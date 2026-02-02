# --- 33. 智能教官 (Onboarding Coach) 逻辑 ---

# 模拟企业内部知识库
KNOWLEDGE_BASE = {
    "退款": "我们的退款政策是：7天无理由，但包装需完好。引导话术：'亲，可以申请，但我建议您先尝试下我们的方案...'",
    "便宜": "强调价值而非价格。引导话术：'亲，一分价钱一分货，我们采用的是航空级铝材...'",
    "发货": "统一回复：48小时内顺丰发出。引导话术：'请放心，您的订单已进入优先处理链路。'"
}

async def shadow_coach_logic(customer_msg, agent_id):
    """
    [新员工福音] 根据客户信息自动匹配带教建议
    """
    suggestion = None
    for key, value in KNOWLEDGE_BASE.items():
        if key in customer_msg:
            suggestion = value
            break
    
    if suggestion:
        payload = {
            "type": "COACH_ADVICE",
            "title": "带教建议：业务流程指引",
            "content": suggestion,
            "voice_alert": "检测到业务咨询，已为您调取标准战术话术。"
        }
        await manager.send_to_user(agent_id, payload)

# 在扫描器识别到对话内容后调用
# await shadow_coach_logic(last_msg, username)
