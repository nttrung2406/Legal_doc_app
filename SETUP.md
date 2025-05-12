# Legal RAG App Setup Guide

This guide will help you set up and run the Legal RAG application locally.

## Prerequisites

- Docker and Docker Compose
- Node.js (v18 or later)
- Python 3.10 or later
- Keycloak
- Ollama

## 1. Keycloak Setup

1. Download and run Keycloak:
```bash
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
```

2. Access Keycloak admin console at `http://localhost:8080`
   - Login with admin/admin
   - Create a new realm named "legal-rag"
   - Create a new client named "legal-rag-client"
   - Set client access type to "confidential"
   - Enable "Direct Access Grants"
   - Note down the client secret

## 2. Database Setup

1. Start PostgreSQL with pgvector:
```bash
cd backend/db
docker-compose up -d
```

2. Create database schema:
```bash
psql -h localhost -U legalraguser -d legalrag -f schema.sql
```

## 3. Minio Setup

1. Start Minio:
```bash
cd backend/db
docker-compose up -d minio
```

2. Access Minio console at `http://localhost:9001`
   - Login with minioadmin/minioadmin
   - Create a bucket named "documents"

## 4. Ollama Setup

1. Install Ollama:
```bash
curl https://ollama.ai/install.sh | sh
```

2. Pull Llama model:
```bash
ollama pull llama2
```

## 5. Backend Services Setup

1. Create virtual environments and install dependencies:
```bash
# Auth Service
cd backend/auth-service
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Document Service
cd ../document-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# RAG Service
cd ../rag-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Create `.env` files for each service with appropriate configurations.

3. Start the services:
```bash
# Auth Service
cd backend/auth-service
uvicorn main:app --reload --port 8000

# Document Service
cd ../document-service
uvicorn main:app --reload --port 8001

# RAG Service
cd ../rag-service
uvicorn main:app --reload --port 8002
```

## 6. Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create `.env` file:
```
REACT_APP_API_BASE_URL=http://localhost:8000
```

3. Start the development server:
```bash
npm start
```

## 7. Monitoring Setup

1. Start Prometheus and Grafana:
```bash
cd backend/loggging
docker-compose up -d
```

2. Access Grafana at `http://localhost:3000`
   - Login with admin/admin
   - Add Prometheus data source
   - Import dashboards for monitoring

## 8. Testing the Setup

1. Open `http://localhost:3000` in your browser
2. Create a new account
3. Upload a legal document
4. Try the Q&A feature

## Troubleshooting

### Common Issues

1. **Keycloak Connection Issues**
   - Verify Keycloak is running
   - Check client credentials
   - Ensure CORS is properly configured

2. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check database credentials
   - Ensure pgvector extension is installed

3. **Document Upload Issues**
   - Check Minio connection
   - Verify file permissions
   - Check file size limits

4. **RAG Pipeline Issues**
   - Verify Ollama is running
   - Check model availability
   - Monitor memory usage

### Logs

- Backend logs: Check the terminal where services are running
- Frontend logs: Check browser console
- Database logs: `docker logs postgres`
- Minio logs: `docker logs minio`

## Security Considerations

1. Change all default passwords
2. Use HTTPS in production
3. Implement proper CORS policies
4. Set up proper firewall rules
5. Regular security updates

## Production Deployment

For production deployment:
1. Use proper SSL certificates
2. Set up proper backup strategies
3. Configure proper monitoring
4. Use Kubernetes for orchestration
5. Implement proper logging and error tracking

## Support

For issues and support:
1. Check the logs
2. Review the documentation
3. Create an issue in the repository
4. Contact the development team 