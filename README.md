# Legal Document Analysis Application

A web application for analyzing legal documents using AI, featuring document summarization, information extraction, and question-answering capabilities.

## Features

- User authentication and authorization
- Document upload and management
- Document summarization
- Information extraction from legal documents
- Question-answering system
- User profile management
- Rate limiting and caching
- Responsive UI with Material-UI

## Tech Stack

### Backend
- FastAPI
- Llama model for text processing
- Keycloak for authentication
- PyMuPDF for PDF processing
- PaddleOCR for text extraction
- PostgreSQL for data storage
- Redis for caching and rate limiting

### Frontend
- ReactJS
- Material-UI
- React Router
- Axios for API calls

## Prerequisites

- Python 3.8+
- Node.js 14+
- PostgreSQL
- Redis
- Keycloak server

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd legal-rag-app
```

2. Set up the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend:
```bash
cd frontend
npm install
```

4. Configure environment variables:
   - Create `.env` files in both `backend` and `frontend` directories
   - Copy the example environment files and update the values:
```bash
# Backend .env
cp backend/.env.example backend/.env
# Frontend .env
cp frontend/.env.example frontend/.env
```

## Running the Application

1. Start the backend services:
```bash
# Start Redis
redis-server

# Start PostgreSQL
sudo service postgresql start

# Start Keycloak
./keycloak/bin/standalone.sh

# Start the backend services
cd backend
source venv/bin/activate
python run.py
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Keycloak: http://localhost:8080

## Running Tests

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Project Structure

```
legal-rag-app/
├── backend/
│   ├── auth-service/
│   ├── document-service/
│   ├── rag-service/
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── tests/
│   └── package.json
└── README.md
```

## API Documentation

Once the backend is running, you can access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 