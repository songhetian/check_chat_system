import asyncio
import json
import base64
import os
import random
import redis.asyncio as redis
from dotenv import load_dotenv
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from pydantic import BaseModel

# Import Database models
from server.database import get_db, SensitiveWord, KnowledgeBase, AuditLog, ProcessGuidance, Product, Customer, CustomerTag, User, Department
from server.ocr_engine import ocr_engine

load_dotenv()

app = FastAPI()

# --- Redis Setup ---
REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")

redis_client = None

@app.on_event("startup")
async def startup_event():
    global redis_client
    if REDIS_HOST:
        try:
            redis_client = redis.Redis(
                host=REDIS_HOST, 
                port=REDIS_PORT, 
                password=REDIS_PASSWORD, 
                decode_responses=True
            )
            await redis_client.ping()
            print(f"✅ Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
        except Exception as e:
            print(f"❌ Redis Connection Failed: {e}")
            redis_client = None
    else:
        print("⚠️ Redis not configured. Using In-Memory mode.")

# Mount static directory
os.makedirs("assets/screenshots", exist_ok=True)
app.mount("/static", StaticFiles(directory="assets"), name="static")

# --- Pydantic Models ---
class HelpRequest(BaseModel):
    agent_id: str
    description: str
    screenshot_base64: str

class OCRRequest(BaseModel):
    agent_id: str
    image_base64: str

class GuidanceCreate(BaseModel):
    keyword: str
    title: str
    content: str
    image_url: Optional[str] = None

class ProductItem(BaseModel):
    name: str
    sku: str
    price: float
    stock: int
    specs: str
    selling_points: str
    tags: str
    department: str = "General"

class TagRequest(BaseModel):
    external_id: str
    name: str = "Unknown"
    tag_text: str
    tag_type: str = "Dept" 
    agent_id: str
    department: str = "General"

# --- Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_agents: Dict[str, dict] = {} 
        self.active_admins: List[dict] = [] 

    async def connect_agent(self, agent_id: str, websocket: WebSocket, dept: str = "General"):
        await websocket.accept()
        self.active_agents[agent_id] = {"ws": websocket, "dept": dept}
        if redis_client:
            await redis_client.publish("agent_events", json.dumps({
                "type": "AGENT_STATUS_CHANGE",
                "agent_id": agent_id,
                "status": "online",
                "dept": dept
            }))
        await self.broadcast_to_admins({
            "type": "AGENT_STATUS_CHANGE",
            "agent_id": agent_id,
            "status": "online",
            "dept": dept
        }, target_dept=dept)

    async def connect_admin(self, websocket: WebSocket, dept: str = "General"):
        await websocket.accept()
        self.active_admins.append({"ws": websocket, "dept": dept})
        relevant_agents = [
            aid for aid, info in self.active_agents.items() 
            if dept == "SuperAdmin" or info["dept"] == dept
        ]
        await websocket.send_json({
            "type": "SYNC_AGENTS",
            "online_agents": relevant_agents,
            "dept_filter": "ALL" if dept == "SuperAdmin" else dept
        })

    def disconnect_agent(self, agent_id: str):
        if agent_id in self.active_agents:
            dept = self.active_agents[agent_id]["dept"]
            del self.active_agents[agent_id]
            asyncio.create_task(self.broadcast_to_admins({
                "type": "AGENT_STATUS_CHANGE",
                "agent_id": agent_id,
                "status": "offline",
                "dept": dept
            }, target_dept=dept))

    def disconnect_admin(self, websocket: WebSocket):
        self.active_admins = [admin for admin in self.active_admins if admin["ws"] != websocket]

    async def broadcast_to_admins(self, message: dict, target_dept: str = None):
        for admin in self.active_admins:
            admin_dept = admin["dept"]
            if admin_dept != "SuperAdmin":
                if target_dept and admin_dept != target_dept:
                    continue
            try:
                await admin["ws"].send_json(message)
            except:
                pass

    async def send_to_agent(self, agent_id: str, message: dict):
        if agent_id in self.active_agents:
            await self.active_agents[agent_id]["ws"].send_json(message)

manager = ConnectionManager()

# --- Auth APIs ---
@app.post("/api/auth/login")
def login(req: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or user.password_hash != req.password: # In production, use bcrypt.checkpw
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if user.status != "Active":
        raise HTTPException(status_code=403, detail="Account suspended")

    dept = db.query(Department).filter(Department.id == user.department_id).first()
    dept_name = dept.name if dept else "General"

    # Update last login
    user.last_login = datetime.now()
    db.commit()

    return {
        "status": "ok",
        "user": {
            "id": user.id,
            "username": user.username,
            "real_name": user.real_name,
            "role": user.role,
            "department": dept_name
        }
    }

# --- Management APIs ---
@app.get("/api/admin/departments")
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@app.post("/api/admin/departments")
def create_department(name: str, desc: str = "", db: Session = Depends(get_db)):
    new_dept = Department(name=name, description=desc)
    db.add(new_dept)
    db.commit()
    return {"status": "ok"}

@app.get("/api/admin/users")
def list_users(dept_id: Optional[int] = None, q: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(User)
    if dept_id:
        query = query.filter(User.department_id == dept_id)
    if q:
        query = query.filter((User.real_name.ilike(f"%{q}%")) | (User.username.ilike(f"%{q}%")))
    
    users = query.all()
    return [{
        "id": u.id,
        "username": u.username,
        "real_name": u.real_name,
        "role": u.role,
        "department_id": u.department_id,
        "status": u.status,
        "last_login": u.last_login
    } for u in users]

@app.put("/api/admin/departments/{dept_id}")
def update_department(dept_id: int, name: str, desc: str = "", db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if dept:
        dept.name = name
        dept.description = desc
        db.commit()
    return {"status": "ok"}

@app.get("/api/hq/overview")
def get_hq_overview(db: Session = Depends(get_db)):
    # 1. Real-time Online Count (from ConnectionManager)
    online_count = len(manager.active_agents)
    
    # 2. Today's Violations
    today_start = datetime.now().replace(hour=0, minute=0, second=0)
    violation_count = db.query(AuditLog).filter(AuditLog.event_type == "VIOLATION", AuditLog.timestamp >= today_start).count()
    
    # 3. Department Risk Stats
    depts = db.query(Department).all()
    risk_data = []
    for d in depts:
        count = db.query(AuditLog).join(User, User.username == AuditLog.agent_id).filter(
            User.department_id == d.id, 
            AuditLog.event_type == "VIOLATION"
        ).count()
        risk_data.append({"name": d.name, "value": count})

    return {
        "online_agents": online_count,
        "total_violations": violation_count,
        "risk_distribution": risk_data,
        "system_status": "Operational",
        "last_update": datetime.now().strftime("%H:%M:%S")
    }

@app.post("/api/admin/users")
def create_user(data: dict, db: Session = Depends(get_db)):
    # Basic validation
    if db.query(User).filter(User.username == data['username']).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_user = User(
        username=data['username'],
        password_hash=hash_password(data['password']), # Always hashed
        real_name=data['real_name'],
        role=data.get('role', 'AGENT'),
        department_id=data['department_id'],
        status="Active"
    )
    db.add(new_user)
    db.commit()
    return {"status": "ok"}

@app.put("/api/admin/users/{user_id}")
def update_user(user_id: int, data: dict, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404)
    
    if "real_name" in data: user.real_name = data["real_name"]
    if "status" in data: user.status = data["status"]
    if "password" in data and data["password"]: 
        user.password_hash = hash_password(data["password"])
    
    db.commit()
    return {"status": "ok"}

@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
    return {"status": "ok"}

# --- Customer Image & Tags (V17 Flexible) ---
@app.post("/api/customers/tag")
def add_customer_tag(req: TagRequest, db: Session = Depends(get_db)):
    cust = db.query(Customer).filter(Customer.external_id == req.external_id).first()
    if not cust:
        cust = Customer(external_id=req.external_id, name=req.name, department=req.department)
        db.add(cust)
        db.commit()
        db.refresh(cust)
    
    new_tag = CustomerTag(
        customer_id=cust.id,
        tag_text=req.tag_text,
        tag_type=req.tag_type,
        created_by_agent=req.agent_id
    )
    db.add(new_tag)
    db.commit()
    return {"status": "ok", "tag_id": new_tag.id}

@app.get("/api/customers/info")
def get_customer_info(agent_id: str, dept: str, external_id: Optional[str] = None, name: Optional[str] = None, db: Session = Depends(get_db)):
    """Search by ID OR Name (for UIA tracking)"""
    query = db.query(Customer)
    if external_id:
        cust = query.filter(Customer.external_id == external_id).first()
    elif name:
        # Fuzzy match name from window title
        cust = query.filter(Customer.name.ilike(f"%{name}%")).first()
    else:
        return {"found": False}

    if not cust:
        return {"found": False}
    
    all_tags = db.query(CustomerTag).filter(CustomerTag.customer_id == cust.id).all()
    visible_tags = []
    for t in all_tags:
        is_visible = False
        if t.tag_type == "Global":
            is_visible = True
        elif t.tag_type == "Dept" and dept == cust.department:
            is_visible = True
        elif t.tag_type == "Private" and t.created_by_agent == agent_id:
            is_visible = True
            
        if is_visible:
            visible_tags.append({
                "text": t.tag_text, 
                "type": t.tag_type,
                "author": t.created_by_agent,
                "date": t.created_at.strftime("%Y-%m-%d")
            })
    
    mock_orders = [
        {"id": "ORD-2023-001", "item": "iPhone 15 Pro", "date": "2023-10-20", "status": "Completed"},
        {"id": "ORD-2023-002", "item": "AirPods", "date": "2023-09-15", "status": "Return"}
    ]
            
    return {
        "found": True,
        "name": cust.name,
        "avatar": cust.avatar_url,
        "level": cust.level,
        "ltv": cust.ltv,
        "return_rate": cust.return_rate,
        "tags": visible_tags,
        "orders": mock_orders
    }

# --- REST APIs (Rest same as V16) ---
@app.get("/api/config/sensitive-words")
def get_sensitive_words(db: Session = Depends(get_db)):
    words = db.query(SensitiveWord).all()
    return {"words": [w.word for w in words], "details": [{"word": w.word, "action": w.action} for w in words]}

@app.get("/api/knowledge/search")
def search_knowledge(q: str, db: Session = Depends(get_db)):
    if not q: return []
    results = db.query(KnowledgeBase).filter((KnowledgeBase.keywords.ilike(f"%{q}%")) | (KnowledgeBase.question.ilike(f"%{q}%"))).limit(5).all()
    return [{"id": r.id, "question": r.question, "answer": r.answer} for r in results]

@app.post("/api/agent/help")
async def submit_help_request(req: HelpRequest, db: Session = Depends(get_db)):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"screenshot_{req.agent_id}_{timestamp}.png"
    file_path = os.path.join("assets/screenshots", filename)
    try:
        image_data = base64.b64decode(req.screenshot_base64)
        with open(file_path, "wb") as f:
            f.write(image_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image save failed: {str(e)}")
    log = AuditLog(agent_id=req.agent_id, event_type="HELP_REQUEST", details=req.description, screenshot_path=f"/static/screenshots/{filename}")
    db.add(log)
    db.commit()
    dept = "General"
    if req.agent_id in manager.active_agents:
        dept = manager.active_agents[req.agent_id]["dept"]
    await manager.broadcast_to_admins({"type": "HELP_REQUEST", "agent_id": req.agent_id, "description": req.description, "screenshot_url": f"http://localhost:8000/static/screenshots/{filename}", "time": timestamp, "dept": dept}, target_dept=dept)
    return {"status": "ok"}

@app.get("/api/guidance/all")
def get_all_guidance(db: Session = Depends(get_db)):
    return db.query(ProcessGuidance).all()

@app.get("/api/products/search")
def search_products(q: str, dept: str = "General", db: Session = Depends(get_db)):
    if not q: return []
    search_term = f"%{q}%"
    query = db.query(Product)
    if dept != "SuperAdmin":
        query = query.filter((Product.department == dept) | (Product.department == "General"))
    results = query.filter((Product.name.ilike(search_term)) | (Product.sku.ilike(search_term)) | (Product.tags.ilike(search_term))).limit(10).all()
    return results

# --- WebSocket Routes ---
@app.websocket("/ws/agent/{agent_id}")
async def websocket_agent(websocket: WebSocket, agent_id: str):
    dept = websocket.query_params.get("dept", "General")
    await manager.connect_agent(agent_id, websocket, dept)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            if message.get("type") == "AGENT_VIOLATION":
                img_data = message.get("screenshot_base64")
                screenshot_url = None
                if img_data:
                    try:
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        filename = f"violation_{agent_id}_{timestamp}.jpg"
                        file_path = os.path.join("assets/screenshots", filename)
                        with open(file_path, "wb") as f: f.write(base64.b64decode(img_data))
                        screenshot_url = f"/static/screenshots/{filename}"
                        message["screenshot_base64"] = None 
                        message["screenshot_url"] = f"http://localhost:8000{screenshot_url}"
                    except: pass
                from server.database import SessionLocal
                db = SessionLocal()
                try:
                    log = AuditLog(agent_id=agent_id, event_type="VIOLATION", details=f"Keyword: {message.get('keyword')}", screenshot_path=screenshot_url, timestamp=datetime.now())
                    db.add(log); db.commit()
                finally: db.close()
            await manager.broadcast_to_admins({"from": agent_id, "dept": dept, **message}, target_dept=dept)
    except WebSocketDisconnect: manager.disconnect_agent(agent_id)

@app.websocket("/ws/admin")
async def websocket_admin(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token or token not in active_tokens:
        await websocket.close(code=4001)
        return
        
    session = active_tokens[token]
    # Admin roles check
    if session["role"] not in ["SUPERVISOR", "ADMIN", "HQ"]:
        await websocket.close(code=4003)
        return

    dept = session["department"]
    if session["role"] == "ADMIN":
        dept = "SuperAdmin"
        
    await manager.connect_admin(websocket, dept)
    # ... rest of the code



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)