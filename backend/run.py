from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from auth_service.main import router as auth_router
from document_service.main import router as document_router
from rag_service.main import router as rag_router

app = FastAPI(title="Legal RAG API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(document_router, prefix="/documents", tags=["Documents"])
app.include_router(rag_router, prefix="/rag", tags=["RAG"])

@app.get("/")
async def root():
    return {"message": "Welcome to Legal RAG API"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(
        "run:app",
        host="0.0.0.0",
        port=port,
        reload=True 
    ) 