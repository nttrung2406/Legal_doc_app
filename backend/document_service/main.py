from fastapi import APIRouter, UploadFile, File
from typing import List

router = APIRouter()

@router.get("/")
async def document_root():
    return {"message": "Document Service is running"}

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    # TODO: Implement document upload and processing
    return {"filename": file.filename, "message": "Document uploaded successfully"} 