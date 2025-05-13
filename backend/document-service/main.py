from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF
from paddleocr import PaddleOCR
import os
from minio import Minio
from datetime import datetime
import uuid
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

minio_client = Minio(
    os.getenv("MINIO_ENDPOINT", "localhost:9000"),
    access_key=os.getenv("MINIO_ACCESS_KEY"),
    secret_key=os.getenv("MINIO_SECRET_KEY"),
    secure=False
)

if not minio_client.bucket_exists("documents"):
    minio_client.make_bucket("documents")

ocr = PaddleOCR(use_angle_cls=True, lang='en')

def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        host=os.getenv("POSTGRES_HOST")
    )

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = None
):
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        temp_path = f"/tmp/{unique_filename}"
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Extract text using PyMuPDF
        doc = fitz.open(temp_path)
        text = ""
        for page in doc:
            text += page.get_text()

        # If text is empty, try OCR
        if not text.strip():
            result = ocr.ocr(temp_path)
            text = " ".join([line[1][0] for line in result[0]])

        # Upload to Minio
        minio_client.fput_object(
            "documents",
            unique_filename,
            temp_path
        )

        # Store metadata in PostgreSQL
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO documents (user_id, filename, original_filename, text_content, upload_date)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
            """,
            (user_id, unique_filename, file.filename, text, datetime.now())
        )
        doc_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        # Clean up temp file
        os.remove(temp_path)

        return {
            "message": "Document uploaded successfully",
            "document_id": doc_id,
            "filename": unique_filename
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{user_id}")
async def get_user_documents(user_id: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, original_filename, upload_date
            FROM documents
            WHERE user_id = %s
            ORDER BY upload_date DESC
            """,
            (user_id,)
        )
        documents = cur.fetchall()
        cur.close()
        conn.close()

        return [
            {
                "id": doc[0],
                "filename": doc[1],
                "upload_date": doc[2]
            }
            for doc in documents
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "document-service running"}

# TODO: Add endpoints for document upload, extraction, and user-doc association 