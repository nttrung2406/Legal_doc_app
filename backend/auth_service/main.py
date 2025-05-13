from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@router.get("/")
async def auth_root():
    return {"message": "Auth Service is running"}

@router.post("/token")
async def login():
    # TODO: Implement actual authentication logic
    return {"message": "Login endpoint"} 