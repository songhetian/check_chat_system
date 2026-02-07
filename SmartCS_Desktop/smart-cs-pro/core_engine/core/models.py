from tortoise import fields, models

class BaseModel(models.Model):
    is_deleted = fields.IntField(default=0)
    
    class Meta:
        abstract = True

class Role(BaseModel):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=50, unique=True)
    code = fields.CharField(max_length=20, unique=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "roles"

class Department(BaseModel):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=50, unique=True)
    manager = fields.ForeignKeyField('models.User', related_name='managed_departments', null=True)
    
    class Meta:
        table = "departments"

class User(BaseModel):
    id = fields.IntField(pk=True)
    username = fields.CharField(max_length=50, unique=True)
    password_hash = fields.CharField(max_length=128)
    salt = fields.CharField(max_length=32)
    real_name = fields.CharField(max_length=50)
    role = fields.ForeignKeyField('models.Role', related_name='users')
    tactical_score = fields.IntField(default=0)
    status = fields.IntField(default=1)
    streak_days = fields.IntField(default=0)
    handled_customers_count = fields.IntField(default=0)
    rank_level = fields.CharField(max_length=20, default="NOVICE")
    graduated_at = fields.DatetimeField(null=True)
    department = fields.ForeignKeyField('models.Department', related_name='users', null=True)

    class Meta:
        table = "users"

class UserReward(BaseModel):
    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField('models.User', related_name='rewards')
    type = fields.CharField(max_length=20)
    title = fields.CharField(max_length=100)
    value = fields.IntField(default=0)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "user_rewards"

class TrainingSession(BaseModel):
    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField('models.User', related_name='training_sessions')
    mode = fields.CharField(max_length=50, default="SOP_GUIDE")
    progress = fields.IntField(default=0)
    is_completed = fields.IntField(default=0)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "training_sessions"

class PolicyCategory(BaseModel):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=50)
    type = fields.CharField(max_length=20)
    description = fields.CharField(max_length=200, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "policy_categories"

class SensitiveWord(BaseModel):
    id = fields.IntField(pk=True)
    word = fields.CharField(max_length=100, unique=True)
    category = fields.ForeignKeyField('models.PolicyCategory', related_name='sensitive_words')
    risk_level = fields.IntField(default=5)
    custom_audio_path = fields.CharField(max_length=255, null=True) # 支持自定义声音
    is_active = fields.IntField(default=1)

    class Meta:
        table = "sensitive_words"

class KnowledgeBase(BaseModel):
    id = fields.IntField(pk=True)
    keyword = fields.CharField(max_length=100)
    answer = fields.TextField()
    category = fields.ForeignKeyField('models.PolicyCategory', related_name='knowledge_items')
    department = fields.ForeignKeyField('models.Department', related_name='knowledge_items', null=True) # NULL 表示全局话术
    is_active = fields.IntField(default=1)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "knowledge_base"

class Permission(BaseModel):
    id = fields.IntField(pk=True)
    code = fields.CharField(max_length=50, unique=True)
    name = fields.CharField(max_length=100)
    module = fields.CharField(max_length=50)

    class Meta:
        table = "permissions"

class RolePermission(BaseModel):
    id = fields.IntField(pk=True)
    role = fields.ForeignKeyField('models.Role', related_name='permissions')
    permission_code = fields.CharField(max_length=50)

    class Meta:
        table = "role_permissions"

class ViolationRecord(BaseModel):
    id = fields.CharField(max_length=50, pk=True)
    user = fields.ForeignKeyField('models.User', related_name='violations', index=True)
    keyword = fields.CharField(max_length=100, index=True)
    context = fields.TextField()
    risk_score = fields.IntField(index=True)
    solution = fields.TextField(null=True)
    status = fields.CharField(max_length=20, default="PENDING")
    screenshot_url = fields.TextField(null=True)
    timestamp = fields.DatetimeField(auto_now_add=True, index=True)

    class Meta:
        table = "violation_records"

class Customer(BaseModel):
    name = fields.CharField(max_length=100, pk=True)
    level = fields.CharField(max_length=20, default="NEW")
    tags = fields.TextField(null=True)
    ltv = fields.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    frequency = fields.IntField(default=1)
    last_seen_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "customers"

class Notification(BaseModel):
    id = fields.CharField(max_length=50, pk=True)
    title = fields.CharField(max_length=255)
    content = fields.TextField()
    type = fields.CharField(max_length=50, default="INFO")
    is_read = fields.IntField(default=0)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "notifications"

class AuditLog(BaseModel):
    id = fields.IntField(pk=True)
    operator = fields.CharField(max_length=50)
    action = fields.CharField(max_length=50)
    target = fields.CharField(max_length=100, null=True)
    details = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "audit_logs"

class Product(BaseModel):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100)
    sku = fields.CharField(max_length=50, unique=True)
    price = fields.DecimalField(max_digits=10, decimal_places=2)
    usp = fields.TextField()
    stock = fields.IntField(default=0)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "products"

class Platform(BaseModel):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=50)
    keyword = fields.CharField(max_length=50, unique=True)
    is_active = fields.IntField(default=1)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "platforms"
