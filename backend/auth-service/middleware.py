from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from typing import Callable
import logging
import traceback
from datetime import datetime, timedelta
from collections import defaultdict
import redis
import os
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Redis configuration
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=0
)

# Rate limiting configuration
RATE_LIMIT = 100  # requests per minute
RATE_WINDOW = 60  # seconds

# In-memory rate limiting (fallback if Redis is not available)
request_counts = defaultdict(list)

class RateLimitExceeded(Exception):
    pass

def check_rate_limit(request: Request):
    client_ip = request.client.host
    current_time = datetime.now()
    
    try:
        # Try Redis first
        key = f"rate_limit:{client_ip}"
        current = redis_client.get(key)
        
        if current is None:
            redis_client.setex(key, RATE_WINDOW, 1)
        elif int(current) >= RATE_LIMIT:
            raise RateLimitExceeded()
        else:
            redis_client.incr(key)
    except redis.RedisError:
        # Fallback to in-memory rate limiting
        if client_ip in request_counts:
            # Remove old requests
            request_counts[client_ip] = [
                t for t in request_counts[client_ip]
                if current_time - t < timedelta(seconds=RATE_WINDOW)
            ]
            
            if len(request_counts[client_ip]) >= RATE_LIMIT:
                raise RateLimitExceeded()
            
            request_counts[client_ip].append(current_time)
        else:
            request_counts[client_ip] = [current_time]

async def error_handler_middleware(request: Request, call_next: Callable):
    try:
        # Check rate limit
        check_rate_limit(request)
        
        return await call_next(request)
    except RateLimitExceeded:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Please try again later."}
        )
    except HTTPException as e:
        logger.error(f"HTTP Exception: {str(e)}")
        return JSONResponse(
            status_code=e.status_code,
            content={"detail": e.detail}
        )
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}\n{traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )

def cache_response(expire_time: int = 300):  # 5 minutes default
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Generate cache key from function arguments
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            try:
                # Try to get from cache
                cached_result = redis_client.get(cache_key)
                if cached_result:
                    return JSONResponse(content=cached_result)
                
                # If not in cache, execute function
                result = await func(*args, **kwargs)
                
                # Cache the result
                redis_client.setex(
                    cache_key,
                    expire_time,
                    str(result)
                )
                
                return result
            except redis.RedisError:
                # If Redis fails, just execute the function
                return await func(*args, **kwargs)
        
        return wrapper
    return decorator

def validate_token(token: str) -> bool:
    """Validate JWT token format and expiration"""
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")
    
    try:
        # Add your token validation logic here
        return True
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

def validate_user_input(username: str, password: str) -> None:
    """Validate user input for login/signup"""
    if not username or len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters long")
    
    if not password or len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long") 