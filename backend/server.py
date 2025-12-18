from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'dicer-admin-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Hardcoded admin credentials
ADMIN_EMAIL = "superadmin@gmail.com"
ADMIN_PASSWORD = "LS@Super"

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    email: str
    message: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    role: str = "user"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    role: str = "user"

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: str

class UsersListResponse(BaseModel):
    users: List[UserResponse]
    total: int

# Helper functions
def create_jwt_token(email: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": email,
        "exp": expiration,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth Routes
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    if request.email == ADMIN_EMAIL and request.password == ADMIN_PASSWORD:
        token = create_jwt_token(request.email)
        return LoginResponse(
            token=token,
            email=request.email,
            message="Login successful"
        )
    raise HTTPException(status_code=401, detail="Invalid credentials")

@api_router.get("/auth/verify")
async def verify_token(email: str = Depends(verify_jwt_token)):
    return {"valid": True, "email": email}

# User Routes
@api_router.get("/users", response_model=UsersListResponse)
async def get_users(email: str = Depends(verify_jwt_token)):
    users_cursor = db.users.find({}, {"_id": 0})
    users = await users_cursor.to_list(1000)
    
    user_responses = []
    for user in users:
        user_responses.append(UserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            role=user.get("role", "user"),
            created_at=user["created_at"] if isinstance(user["created_at"], str) else user["created_at"].isoformat()
        ))
    
    return UsersListResponse(users=user_responses, total=len(user_responses))

@api_router.post("/users", response_model=UserResponse)
async def create_user(user_data: UserCreate, email: str = Depends(verify_jwt_token)):
    # Check if email already exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    user = User(
        name=user_data.name,
        email=user_data.email,
        role=user_data.role
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        created_at=doc['created_at']
    )

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, email: str = Depends(verify_jwt_token)):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully", "id": user_id}

@api_router.get("/users/count")
async def get_users_count(email: str = Depends(verify_jwt_token)):
    count = await db.users.count_documents({})
    return {"count": count}

# Health check
@api_router.get("/")
async def root():
    return {"message": "Dicer Admin API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
