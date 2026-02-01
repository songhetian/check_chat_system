import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Read Config
DB_TYPE = os.getenv("DB_TYPE", "sqlite")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "smart_cs")

# Construct Connection String
if DB_TYPE == "mysql":
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    # Performance Tuning for High Concurrency
    connect_args = {}
    engine = create_engine(
        DATABASE_URL, 
        pool_size=20, # Initial connections
        max_overflow=50, # Max extra connections
        pool_recycle=3600,
        pool_pre_ping=True
    )
else:
    # SQLite
    DATABASE_URL = "sqlite:///./smart_cs.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Models Definition ---
from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from datetime import datetime

class SensitiveWord(Base):
    __tablename__ = "sensitive_words"
    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(100), unique=True, index=True)
    level = Column(String(20))
    action = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"
    id = Column(Integer, primary_key=True, index=True)
    keywords = Column(String(200), index=True)
    question = Column(String(500))
    answer = Column(Text)
    category = Column(String(50))
    usage_count = Column(Integer, default=0)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(String(50))
    event_type = Column(String(50))
    details = Column(Text)
    screenshot_path = Column(String(200), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class ProcessGuidance(Base):
    __tablename__ = "process_guidance"
    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String(100), unique=True, index=True)
    title = Column(String(200))
    content = Column(Text)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), index=True)
    sku = Column(String(50), unique=True, index=True)
    price = Column(Float)
    stock = Column(Integer, default=0)
    specs = Column(Text)
    selling_points = Column(Text)
    tags = Column(String(200))
    department = Column(String(50), default="General", index=True)

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(100), unique=True, index=True) 
    name = Column(String(100))
    department = Column(String(50), default="General")
    # V16.0 New Fields
    avatar_url = Column(String(500), nullable=True)
    level = Column(String(20), default="Lv1") # Lv1 - Lv5 (Black Card)
    ltv = Column(Float, default=0.0) # Life Time Value
    return_rate = Column(Float, default=0.0) # 0.0 - 1.0
    created_at = Column(DateTime, default=datetime.utcnow)

class CustomerTag(Base):
    __tablename__ = "customer_tags"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, index=True)
    tag_text = Column(String(50))
    tag_type = Column(String(20)) # Private, Dept, Global
    created_by_agent = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

class AgentPerformance(Base):
    __tablename__ = "agent_performance"
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(String(50), unique=True, index=True)
    clean_days = Column(Integer, default=0) # Consecutive days without violation
    safe_messages = Column(Integer, default=0) # Total messages without violation
    honor_points = Column(Integer, default=0) # Calculated score
    department = Column(String(50))

# Create tables automatically
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()