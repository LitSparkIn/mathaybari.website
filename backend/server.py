from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any
import random
import string
from datetime import datetime, timezone, timedelta
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'mathaybari-admin-secret-key-2024')
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

# Standard Response Helper
def api_response(code: int, status: str, data: Any):
    return JSONResponse(
        status_code=code,
        content={
            "code": code,
            "status": status,
            "data": data
        }
    )

def success_response(data: Any, code: int = 200):
    return api_response(code, "success", data)

def error_response(message: str, code: int = 400):
    return api_response(code, "failure", {"message": message})

# Helper functions
def generate_password(length=6):
    """Generate a 6 digit alphanumeric password"""
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def generate_secret_code(length=5):
    """Generate a 5 digit numeric secret code"""
    return ''.join(random.choice(string.digits) for _ in range(length))

async def get_next_user_id():
    """Get next auto-increment 4 digit user ID"""
    last_user = await db.users.find_one(
        {},
        sort=[("user_id", -1)],
        projection={"user_id": 1, "_id": 0}
    )
    
    if last_user and "user_id" in last_user:
        next_id = last_user["user_id"] + 1
    else:
        next_id = 1001
    
    return next_id

# Models
class LoginRequest(BaseModel):
    email: str
    password: str

class UserLoginRequest(BaseModel):
    phone: str
    password: str

class UserSignupRequest(BaseModel):
    name: str
    phone: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: int
    name: str
    phone: str
    device_number: str = ""
    device_mac_address: str = ""
    last_run_location: str = ""
    password: str
    secret_code: str
    status: str = "Inactive"
    token_version: int = 1
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper functions for JWT
def create_jwt_token(email: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": email,
        "exp": expiration,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_user_jwt_token(user_id: int, phone: str, token_version: int = 1) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": str(user_id),
        "phone": phone,
        "type": "user",
        "token_version": token_version,
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
@api_router.post("/auth/login")
async def login(request: LoginRequest):
    if request.email == ADMIN_EMAIL and request.password == ADMIN_PASSWORD:
        token = create_jwt_token(request.email)
        return success_response({
            "token": token,
            "email": request.email,
            "message": "Login successful"
        })
    return error_response("Invalid credentials", 401)

@api_router.get("/auth/verify")
async def verify_token(email: str = Depends(verify_jwt_token)):
    return success_response({
        "valid": True,
        "email": email
    })

# User Login Route (Public - No Auth Required)
@api_router.post("/users/login")
async def user_login(request: UserLoginRequest):
    # Find user by phone
    user = await db.users.find_one({"phone": request.phone}, {"_id": 0})
    
    if not user:
        return error_response("User not found", 404)
    
    if user["password"] != request.password:
        return error_response("Invalid credentials", 401)
    
    if user["status"] != "Active":
        return error_response("Account is inactive. Please contact admin.", 403)
    
    # Generate JWT token
    token = create_user_jwt_token(user["user_id"], user["phone"], user.get("token_version", 1))
    
    return success_response({
        "token": token,
        "user_id": user["user_id"],
        "name": user["name"],
        "phone": user["phone"],
        "device_id": user.get("device_number") if user.get("device_number") else None,
        "mac_id": user.get("device_mac_address") if user.get("device_mac_address") else None,
        "status": user["status"],
        "message": "Login successful"
    })

# Get user details by device ID (Public - No Auth Required)
@api_router.get("/users/get-details-by-device-id")
async def get_details_by_device_id(device_id: str):
    if not device_id:
        return error_response("Device ID is required", 400)
    
    user = await db.users.find_one({"device_number": device_id}, {"_id": 0})
    
    if not user:
        return error_response("No user found with this device ID", 404)
    
    return success_response({
        "phone": user["phone"]
    })

# Validate User API (Public)
class ValidateUserRequest(BaseModel):
    token: str
    phone: str
    password: str
    mac_id: str
    device_id: str

@api_router.post("/users/validate")
async def validate_user(request: ValidateUserRequest):
    try:
        # Decode and verify token
        payload = jwt.decode(request.token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Check if it's a user token
        if payload.get("type") != "user":
            return error_response("User Invalid", 401)
        
        user_id = int(payload.get("sub"))
        token_version = payload.get("token_version", 1)
        
        # Find user in database
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        if not user:
            return error_response("User Invalid", 401)
        
        # Check if token version matches (password hasn't been reset)
        if user.get("token_version", 1) != token_version:
            return error_response("User Invalid", 401)
        
        # Check if user is active
        if user.get("status") != "Active":
            return error_response("User Invalid", 401)
        
        # Validate phone
        if user.get("phone") != request.phone:
            return error_response("User Invalid", 401)
        
        # Validate password
        if user.get("password") != request.password:
            return error_response("User Invalid", 401)
        
        # Validate MAC address
        if user.get("device_mac_address") != request.mac_id:
            return error_response("User Invalid", 401)
        
        # Validate Device ID
        if user.get("device_number") != request.device_id:
            return error_response("User Invalid", 401)
        
        # All validations passed
        return success_response({
            "message": "User Valid"
        })
        
    except jwt.ExpiredSignatureError:
        return error_response("User Invalid", 401)
    except jwt.InvalidTokenError:
        return error_response("User Invalid", 401)
    except Exception:
        return error_response("User Invalid", 401)

# User Signup Route (Public - No Auth Required)
@api_router.post("/users/signup")
async def signup_user(request: UserSignupRequest):
    # Check if phone already exists
    existing = await db.users.find_one({"phone": request.phone}, {"_id": 0})
    if existing:
        return error_response("User with this phone number already exists", 400)
    
    # Generate user data
    user_id = await get_next_user_id()
    password = generate_password(6)
    secret_code = generate_secret_code(5)
    
    user = User(
        user_id=user_id,
        name=request.name,
        phone=request.phone,
        device_number="",
        device_mac_address="",
        last_run_location="",
        password=password,
        secret_code=secret_code,
        status="Inactive",
        token_version=1
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    return success_response({
        "user_id": user.user_id,
        "name": user.name,
        "phone": user.phone,
        "password": user.password,
        "secret_code": user.secret_code,
        "status": user.status,
        "message": "User registered successfully"
    }, 201)

# User Routes (Protected)
@api_router.get("/users")
async def get_users(email: str = Depends(verify_jwt_token)):
    users_cursor = db.users.find({}, {"_id": 0}).sort("user_id", 1)
    users = await users_cursor.to_list(1000)
    
    user_responses = []
    for user in users:
        user_responses.append({
            "user_id": user["user_id"],
            "name": user["name"],
            "phone": user["phone"],
            "device_number": user.get("device_number", ""),
            "device_mac_address": user.get("device_mac_address", ""),
            "last_run_location": user.get("last_run_location", ""),
            "password": user["password"],
            "secret_code": user["secret_code"],
            "status": user.get("status", "Inactive"),
            "created_at": user["created_at"] if isinstance(user["created_at"], str) else user["created_at"].isoformat()
        })
    
    return success_response({
        "users": user_responses,
        "total": len(user_responses)
    })

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: int, email: str = Depends(verify_jwt_token)):
    result = await db.users.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        return error_response("User not found", 404)
    return success_response({
        "message": "User deleted successfully",
        "user_id": user_id
    })

@api_router.patch("/users/{user_id}/status")
async def update_user_status(user_id: int, status: str, device_number: str = None, device_mac_address: str = None, email: str = Depends(verify_jwt_token)):
    if status not in ["Active", "Inactive"]:
        return error_response("Status must be 'Active' or 'Inactive'", 400)
    
    # Device number and MAC address are required when activating
    if status == "Active":
        if not device_number:
            return error_response("Device number is required when activating a user", 400)
        if not device_mac_address:
            return error_response("Device MAC address is required when activating a user", 400)
    
    update_data = {"status": status}
    if status == "Active":
        update_data["device_number"] = device_number
        update_data["device_mac_address"] = device_mac_address
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        return error_response("User not found", 404)
    
    return success_response({
        "message": f"User status updated to {status}",
        "user_id": user_id,
        "device_number": device_number if status == "Active" else None,
        "device_mac_address": device_mac_address if status == "Active" else None
    })

@api_router.get("/users/count")
async def get_users_count(email: str = Depends(verify_jwt_token)):
    count = await db.users.count_documents({})
    return success_response({"count": count})

# Reset Password (Protected)
@api_router.patch("/users/{user_id}/reset-password")
async def reset_password(user_id: int, email: str = Depends(verify_jwt_token)):
    # Generate new password
    new_password = generate_password(6)
    
    # Increment token_version to invalidate existing tokens
    result = await db.users.update_one(
        {"user_id": user_id},
        {
            "$set": {"password": new_password},
            "$inc": {"token_version": 1}
        }
    )
    
    if result.matched_count == 0:
        return error_response("User not found", 404)
    
    return success_response({
        "message": "Password reset successfully. User's existing sessions have been invalidated.",
        "user_id": user_id,
        "new_password": new_password
    })

# Reset Secret Code (Protected)
@api_router.patch("/users/{user_id}/reset-secret-code")
async def reset_secret_code(user_id: int, email: str = Depends(verify_jwt_token)):
    # Generate new secret code
    new_secret_code = generate_secret_code(5)
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"secret_code": new_secret_code}}
    )
    
    if result.matched_count == 0:
        return error_response("User not found", 404)
    
    return success_response({
        "message": "Secret code reset successfully.",
        "user_id": user_id,
        "new_secret_code": new_secret_code
    })

# Health check
@api_router.get("/")
async def root():
    return success_response({"message": "MathayBari Admin API"})

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
