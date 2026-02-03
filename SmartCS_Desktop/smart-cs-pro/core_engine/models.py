from tortoise import fields, models

class BaseModel(models.Model):
    is_deleted = fields.IntField(default=0)
    
    class Meta:
        abstract = True

class Department(BaseModel):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=50, unique=True)
    
    class Meta:
        table = "departments"

class User(BaseModel):
    id = fields.IntField(pk=True)
    username = fields.CharField(max_length=50, unique=True)
    password_hash = fields.CharField(max_length=128)
    salt = fields.CharField(max_length=32)
    real_name = fields.CharField(max_length=50)
    role = fields.CharField(max_length=20, default="AGENT")
    tactical_score = fields.IntField(default=0)
    status = fields.IntField(default=1)
    # 外键关联
    department = fields.ForeignKeyField('models.Department', related_name='users', null=True)

    class Meta:
        table = "users"

class ViolationRecord(BaseModel):
    id = fields.CharField(max_length=50, pk=True)
    user = fields.ForeignKeyField('models.User', related_name='violations')
    keyword = fields.CharField(max_length=100)
    context = fields.TextField()
    risk_score = fields.IntField()
    timestamp = fields.DatetimeField(auto_now_add=True)

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
