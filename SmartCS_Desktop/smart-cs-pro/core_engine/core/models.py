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
    # 外键关联 Role
    role = fields.ForeignKeyField('models.Role', related_name='users')
    tactical_score = fields.IntField(default=0)
    status = fields.IntField(default=1)
    
    # Growth related fields
    streak_days = fields.IntField(default=0)
    handled_customers_count = fields.IntField(default=0)
    rank_level = fields.CharField(max_length=20, default="NOVICE")
    graduated_at = fields.DatetimeField(null=True)
    
    # 外键关联 Department
    department = fields.ForeignKeyField('models.Department', related_name='users', null=True)

    class Meta:
        table = "users"

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



class SensitiveWord(BaseModel):

    id = fields.IntField(pk=True)

    word = fields.CharField(max_length=100, unique=True)

    category = fields.CharField(max_length=50)

    risk_level = fields.IntField(default=5) # 1-10

    is_active = fields.IntField(default=1)



    class Meta:

        table = "sensitive_words"



class KnowledgeBase(BaseModel):

    id = fields.IntField(pk=True)

    keyword = fields.CharField(max_length=100)

    answer = fields.TextField()

    category = fields.CharField(max_length=50)

    is_active = fields.IntField(default=1)



    class Meta:

        table = "knowledge_base"
