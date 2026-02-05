# [Smart-CS Pro] 战术系统全局常量定义

class RoleID:
    """
    [物理角色 ID 映射]
    必须与数据库 roles 表 ID 严格一致：
    1: 坐席 (AGENT)
    2: 主管 (ADMIN)
    3: 总部 (HQ)
    """
    AGENT = 1
    ADMIN = 2
    HQ = 3
