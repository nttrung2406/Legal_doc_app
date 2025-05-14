from fastapi import APIRouter, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from keycloak import KeycloakOpenID
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()


KEYCLOAK_URL = os.getenv("KEYCLOAK_URL")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID")
KEYCLOAK_CLIENT_SECRET = os.getenv("KEYCLOAK_CLIENT_SECRET")

keycloak_openid = KeycloakOpenID(
    server_url=KEYCLOAK_URL,
    client_id=KEYCLOAK_CLIENT_ID,
    realm_name=KEYCLOAK_REALM,
    client_secret_key=KEYCLOAK_CLIENT_SECRET
)

class UserLogin(BaseModel):
    username: str
    password: str

class UserSignup(BaseModel):
    username: str
    email: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

@router.get("/")
async def auth_root():
    return {"message": "Auth Service is running"}

@router.post("/login")
async def login(user: UserLogin):
    try:
        token = keycloak_openid.token(
            username=user.username,
            password=user.password
        )
        return {
            "access_token": token["access_token"],
            "refresh_token": token["refresh_token"],
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/signup")
async def signup(user: UserSignup):
    try:
        user_id = keycloak_openid.create_user(
            username=user.username,
            email=user.email,
            password=user.password,
            first_name=user.first_name,
            last_name=user.last_name,
            enabled=True
        )
        return {"message": "User created successfully", "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/logout")
async def logout(token: str):
    try:
        keycloak_openid.logout(token)
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/health")
def health():
    return {"status": "auth-service running"}

