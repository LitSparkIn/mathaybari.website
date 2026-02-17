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
    """Generate a 6 character alphanumeric password"""
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
class AdminLoginRequest(BaseModel):
    email: str
    password: str

class UserLoginRequest(BaseModel):
    phone: str
    password: str
    device_id: str
    last_known_location: Optional[str] = None
    last_known_lat_long: Optional[str] = None

class UserSignupRequest(BaseModel):
    name: str
    phone: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: int
    name: str
    phone: str
    device_ids: List[str] = []      # Phone device IDs (alphanumeric)
    ble_ids: List[str] = []          # BLE IDs (8 digits)
    last_run_location: str = ""
    password: str
    secret_code: str
    status: str = "Inactive"
    token_version: int = 1
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ValidateUserRequest(BaseModel):
    token: str
    phone: str
    password: str
    device_id: str

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

# Helper to get device_ids with backward compatibility
def get_device_ids(user: dict) -> List[str]:
    device_ids = user.get("device_ids", [])
    # Backward compatibility with old field names
    if not device_ids:
        if user.get("device_number"):
            device_ids = [user.get("device_number")]
    return device_ids

# Helper to get ble_ids with backward compatibility
def get_ble_ids(user: dict) -> List[str]:
    ble_ids = user.get("ble_ids", [])
    # Backward compatibility with old field names
    if not ble_ids:
        if user.get("device_mac_addresses"):
            ble_ids = user.get("device_mac_addresses")
        elif user.get("device_mac_address"):
            ble_ids = [user.get("device_mac_address")]
    return ble_ids

# ============ BLE TABLE HELPERS ============

async def upsert_ble(ble_id: str, user_id: int, phone: str, name: str):
    """Add or update BLE in ble_usage table with user info"""
    await db.ble_usage.update_one(
        {"ble_id": ble_id},
        {
            "$set": {
                "ble_id": ble_id,
                "user_id": user_id,
                "phone": phone,
                "user_name": name,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$setOnInsert": {
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_login_at": None
            }
        },
        upsert=True
    )

async def remove_user_from_ble(ble_id: str):
    """Remove user info from BLE (when BLE is removed from user)"""
    await db.ble_usage.update_one(
        {"ble_id": ble_id},
        {
            "$set": {
                "user_id": None,
                "phone": None,
                "user_name": None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )

async def update_ble_last_login(user_id: int):
    """Update last_login_at for all BLEs associated with this user"""
    await db.ble_usage.update_many(
        {"user_id": user_id},
        {"$set": {"last_login_at": datetime.now(timezone.utc).isoformat()}}
    )

async def record_login_history(user_id: int, phone: str, name: str, device_id: str, 
                                ble_ids: List[str] = None,
                                last_known_location: str = None, last_known_lat_long: str = None):
    """Record a login event in login_history table"""
    login_record = {
        "user_id": user_id,
        "phone": phone,
        "user_name": name,
        "device_id": device_id,
        "ble_ids": ble_ids or [],
        "login_at": datetime.now(timezone.utc).isoformat(),
        "last_known_location": last_known_location,
        "last_known_lat_long": last_known_lat_long
    }
    await db.login_history.insert_one(login_record)

# ============ ADMIN AUTH ROUTES ============

@api_router.post("/auth/login")
async def admin_login(request: AdminLoginRequest):
    if request.email == ADMIN_EMAIL and request.password == ADMIN_PASSWORD:
        token = create_jwt_token(request.email)
        return success_response({
            "token": token,
            "email": request.email,
            "message": "Login successful"
        })
    return error_response("Invalid credentials", 401)

@api_router.get("/auth/verify")
async def verify_admin_token(email: str = Depends(verify_jwt_token)):
    return success_response({
        "valid": True,
        "email": email
    })

# ============ USER AUTH ROUTES ============

@api_router.post("/users/login")
async def user_login(request: UserLoginRequest):
    # Find user by phone
    user = await db.users.find_one({"phone": request.phone}, {"_id": 0})
    
    if not user:
        return error_response("Invalid credentials", 401)
    
    if user["password"] != request.password:
        return error_response("Invalid credentials", 401)
    
    # Check if device_id is in the list of allowed device_ids (case-insensitive)
    device_ids = get_device_ids(user)
    device_ids_lower = [d.lower() for d in device_ids]
    if request.device_id.lower() not in device_ids_lower:
        return error_response("Invalid credentials", 401)
    
    if user["status"] != "Active":
        return error_response("Account is inactive. Please contact admin.", 403)
    
    # Generate JWT token
    token = create_user_jwt_token(user["user_id"], user["phone"], user.get("token_version", 1))
    
    # Get BLE IDs
    ble_ids = get_ble_ids(user)
    
    # Update last login time for all BLEs associated with this user
    await update_ble_last_login(user["user_id"])
    
    # Record login history (include BLE IDs associated with this user)
    await record_login_history(
        user_id=user["user_id"],
        phone=user["phone"],
        name=user["name"],
        device_id=request.device_id,
        ble_ids=ble_ids,
        last_known_location=request.last_known_location,
        last_known_lat_long=request.last_known_lat_long
    )
    
    return success_response({
        "token": token,
        "user_id": user["user_id"],
        "name": user["name"],
        "phone": user["phone"],
        "device_id": request.device_id,
        "ble_ids": ble_ids if ble_ids else None,
        "status": user["status"],
        "message": "Login successful"
    })

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
        
        # Check if token version matches
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
        
        # Validate Device ID (case-insensitive)
        device_ids = get_device_ids(user)
        device_ids_lower = [d.lower() for d in device_ids]
        if request.device_id.lower() not in device_ids_lower:
            return error_response("User Invalid", 401)
        
        return success_response({
            "message": "User Valid"
        })
        
    except jwt.ExpiredSignatureError:
        return error_response("User Invalid", 401)
    except jwt.InvalidTokenError:
        return error_response("User Invalid", 401)
    except Exception:
        return error_response("User Invalid", 401)

# ============ USER SIGNUP ROUTE ============

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
        device_ids=[],
        ble_ids=[],
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

# ============ USER MANAGEMENT ROUTES (PROTECTED) ============

@api_router.get("/users")
async def get_users(email: str = Depends(verify_jwt_token)):
    users_cursor = db.users.find({}, {"_id": 0}).sort("user_id", 1)
    users = await users_cursor.to_list(1000)
    
    user_responses = []
    for user in users:
        device_ids = get_device_ids(user)
        ble_ids = get_ble_ids(user)
        
        user_responses.append({
            "user_id": user["user_id"],
            "name": user["name"],
            "phone": user["phone"],
            "device_ids": device_ids,
            "ble_ids": ble_ids,
            "last_run_location": user.get("last_run_location", ""),
            "password": user["password"],
            "secret_code": user.get("secret_code", ""),
            "status": user.get("status", "Inactive"),
            "created_at": user["created_at"] if isinstance(user["created_at"], str) else user["created_at"].isoformat()
        })
    
    return success_response({
        "users": user_responses,
        "total": len(user_responses)
    })

@api_router.get("/users/count")
async def get_users_count(email: str = Depends(verify_jwt_token)):
    count = await db.users.count_documents({})
    return success_response({"count": count})

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: int, email: str = Depends(verify_jwt_token)):
    result = await db.users.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        return error_response("User not found", 404)
    return success_response({
        "message": "User deleted successfully",
        "user_id": user_id
    })

# ============ USER STATUS ROUTES ============

@api_router.patch("/users/{user_id}/status")
async def update_user_status(user_id: int, status: str, device_id: str = None, email: str = Depends(verify_jwt_token)):
    if status not in ["Active", "Inactive"]:
        return error_response("Status must be 'Active' or 'Inactive'", 400)
    
    # Device ID is required when activating
    if status == "Active":
        if not device_id:
            return error_response("Device ID is required when activating a user", 400)
    
    # Get current user to preserve existing device_ids
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return error_response("User not found", 404)
    
    update_data = {"status": status}
    final_device_ids = None
    
    if status == "Active":
        # Get existing device_ids
        existing_device_ids = get_device_ids(user)
        
        # If device_id is already in the list, keep existing list
        # Otherwise, add it to the list (for first-time activation or new device)
        if device_id.lower() in [d.lower() for d in existing_device_ids]:
            # Device ID already exists, keep existing list
            final_device_ids = existing_device_ids
        else:
            # New device ID, add to list
            final_device_ids = existing_device_ids + [device_id]
        
        update_data["device_ids"] = final_device_ids
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    return success_response({
        "message": f"User status updated to {status}",
        "user_id": user_id,
        "device_ids": final_device_ids
    })

# ============ DEVICE ID ROUTES ============

@api_router.post("/users/{user_id}/device-id")
async def add_device_id(user_id: int, device_id: str, email: str = Depends(verify_jwt_token)):
    if not device_id:
        return error_response("Device ID is required", 400)
    
    # Get current user
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return error_response("User not found", 404)
    
    # Get current device IDs
    device_ids = get_device_ids(user)
    
    # Check if device ID already exists
    if device_id in device_ids:
        return error_response("Device ID already exists for this user", 400)
    
    # Add new device ID
    device_ids.append(device_id)
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"device_ids": device_ids}}
    )
    
    return success_response({
        "message": "Device ID added successfully.",
        "user_id": user_id,
        "device_ids": device_ids
    })

@api_router.delete("/users/{user_id}/device-id")
async def remove_device_id(user_id: int, device_id: str, email: str = Depends(verify_jwt_token)):
    if not device_id:
        return error_response("Device ID is required", 400)
    
    # Get current user
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return error_response("User not found", 404)
    
    # Get current device IDs
    device_ids = get_device_ids(user)
    
    # Check if device ID exists
    if device_id not in device_ids:
        return error_response("Device ID not found for this user", 404)
    
    # Remove device ID
    device_ids.remove(device_id)
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"device_ids": device_ids}}
    )
    
    return success_response({
        "message": "Device ID removed successfully.",
        "user_id": user_id,
        "device_ids": device_ids
    })

# ============ BLE ID ROUTES ============

@api_router.post("/users/{user_id}/ble-id")
async def add_ble_id(user_id: int, ble_id: str, email: str = Depends(verify_jwt_token)):
    if not ble_id:
        return error_response("BLE ID is required", 400)
    
    if len(ble_id) != 8:
        return error_response("BLE ID must be 8 characters", 400)
    
    # Get current user
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return error_response("User not found", 404)
    
    # Get current BLE IDs
    ble_ids = get_ble_ids(user)
    
    # Check if BLE ID already exists
    if ble_id in ble_ids:
        return error_response("BLE ID already exists for this user", 400)
    
    # Add new BLE ID
    ble_ids.append(ble_id)
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"ble_ids": ble_ids}}
    )
    
    return success_response({
        "message": "BLE ID added successfully.",
        "user_id": user_id,
        "ble_ids": ble_ids
    })

@api_router.delete("/users/{user_id}/ble-id")
async def remove_ble_id(user_id: int, ble_id: str, email: str = Depends(verify_jwt_token)):
    if not ble_id:
        return error_response("BLE ID is required", 400)
    
    # Get current user
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return error_response("User not found", 404)
    
    # Get current BLE IDs
    ble_ids = get_ble_ids(user)
    
    # Check if BLE ID exists
    if ble_id not in ble_ids:
        return error_response("BLE ID not found for this user", 404)
    
    # Remove BLE ID
    ble_ids.remove(ble_id)
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"ble_ids": ble_ids}}
    )
    
    return success_response({
        "message": "BLE ID removed successfully.",
        "user_id": user_id,
        "ble_ids": ble_ids
    })

# ============ PASSWORD RESET ROUTE ============

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

# ============ UTILITY ROUTES ============

@api_router.get("/users/get-details-by-device-id")
async def get_details_by_device_id(device_id: str):
    if not device_id:
        return error_response("Device ID is required", 400)
    
    # Search in device_ids array
    user = await db.users.find_one({"device_ids": device_id}, {"_id": 0})
    
    # Backward compatibility
    if not user:
        user = await db.users.find_one({"device_number": device_id}, {"_id": 0})
    
    if not user:
        return error_response("No user found with this device ID", 404)
    
    return success_response({
        "phone": user["phone"]
    })

# ============ DEVICES ROUTES ============

@api_router.get("/devices")
async def get_devices(email: str = Depends(verify_jwt_token)):
    """Get all devices with their usage info"""
    devices_cursor = db.devices.find({}, {"_id": 0}).sort("last_login_at", -1)
    devices = await devices_cursor.to_list(1000)
    
    return success_response({
        "devices": devices,
        "total": len(devices)
    })

# ============ LOGIN HISTORY ROUTES ============

@api_router.get("/login-history")
async def get_login_history(email: str = Depends(verify_jwt_token)):
    """Get all login history records"""
    history_cursor = db.login_history.find({}, {"_id": 0}).sort("login_at", -1)
    history = await history_cursor.to_list(1000)
    
    return success_response({
        "history": history,
        "total": len(history)
    })

# ============ HEALTH CHECK ============

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
