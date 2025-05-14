from fastapi import APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import psycopg2
from psycopg2.extras import Json
import requests
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import numpy as np

load_dotenv()

router = APIRouter()


# Initialize sentence transformer for embeddings
model = SentenceTransformer('all-MiniLM-L6-v2')

# Database connection
def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        host=os.getenv("POSTGRES_HOST")
    )

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

class Question(BaseModel):
    text: str
    document_id: int

def get_ollama_response(prompt: str) -> str:
    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": "llama2",
                "prompt": prompt,
                "stream": False
            }
        )
        return response.json()["response"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calling Ollama: {str(e)}")

@router.post("/summarize/{document_id}")
async def summarize_document(document_id: int):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "SELECT text_content FROM documents WHERE id = %s",
            (document_id,)
        )
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Document not found")
        
        text = result[0]
        
        prompt = f"Please provide a concise summary of the following legal document:\n\n{text[:2000]}"
        summary = get_ollama_response(prompt)
        
        cur.execute(
            "UPDATE documents SET summary = %s WHERE id = %s",
            (summary, document_id)
        )
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {"summary": summary}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ask")
async def ask_question(question: Question):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get document text
        cur.execute(
            "SELECT text_content FROM documents WHERE id = %s",
            (question.document_id,)
        )
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Document not found")
        
        text = result[0]
        
        question_embedding = model.encode(question.text)
        
        chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]
        chunk_embeddings = model.encode(chunks)
        
        similarities = [np.dot(question_embedding, chunk_embedding) for chunk_embedding in chunk_embeddings]
        most_relevant_chunks = [chunks[i] for i in np.argsort(similarities)[-3:]]
        
        # Generate answer using Llama
        context = "\n".join(most_relevant_chunks)
        prompt = f"""Based on the following context from a legal document, please answer the question.
        
Context:
{context}

Question: {question.text}

Answer:"""
        
        answer = get_ollama_response(prompt)
        
        return {"answer": answer}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sections/{document_id}")
async def get_document_sections(document_id: int):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get document text
        cur.execute(
            "SELECT text_content FROM documents WHERE id = %s",
            (document_id,)
        )
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Document not found")
        
        text = result[0]
        
        prompt = f"""Please identify the main sections in this legal document and provide a brief summary of each section:

{text[:3000]}

Please format the response as a JSON array of objects with 'title' and 'summary' fields."""
        
        sections_text = get_ollama_response(prompt)
        
        return {"sections": sections_text}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
def health():
    return {"status": "rag-service running"}

# TODO: Add endpoints for summarization, section info, and Q&A 