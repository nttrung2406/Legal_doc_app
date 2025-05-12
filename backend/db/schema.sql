-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    text_content TEXT NOT NULL,
    summary TEXT,
    upload_date TIMESTAMP NOT NULL,
    embedding vector(384)
);

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops); 