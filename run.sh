#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' 

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

check_service_health() {
    local url=$1
    local max_attempts=${2:-30}
    local attempt=0
    
    echo -e "${YELLOW}Checking $url...${NC}"
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f "$url" >/dev/null 2>&1; then
            return 0
        fi
        attempt=$((attempt + 1))
        echo -ne "${YELLOW}Attempt $attempt/$max_attempts...${NC}\r"
        sleep 2
    done
    echo ""
    return 1
}

# Wait for database to be ready
wait_for_postgres() {
    echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
    local max_attempts=30
    local attempt=0
    
    # Check if pg_isready is available, if not use alternative method
    if command_exists pg_isready; then
        while [ $attempt -lt $max_attempts ]; do
            if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
                echo -e "${GREEN}PostgreSQL is ready!${NC}"
                return 0
            fi
            attempt=$((attempt + 1))
            sleep 2
        done
    else
        # Alternative method using psql or nc
        while [ $attempt -lt $max_attempts ]; do
            if nc -z localhost 5432 >/dev/null 2>&1; then
                echo -e "${GREEN}PostgreSQL is ready!${NC}"
                return 0
            fi
            attempt=$((attempt + 1))
            sleep 2
        done
    fi
    echo -e "${RED}PostgreSQL failed to start within timeout${NC}"
    return 1
}

find_next_port() {
    local port=$1
    while port_in_use $port; do
        port=$((port + 1))
    done
    echo $port
}

# Enhanced cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    
    # Kill all background processes first
    for pid_file in .*.pid; do
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file")
            echo -e "${YELLOW}Stopping process with PID: $pid${NC}"
            kill -TERM $pid 2>/dev/null
            sleep 2
            kill -KILL $pid 2>/dev/null
            rm "$pid_file"
        fi
    done
    
    # Stop any remaining backend/frontend processes
    pkill -f "python3 run.py" 2>/dev/null
    pkill -f "npm start" 2>/dev/null
    pkill -f "react-scripts start" 2>/dev/null
    
    echo -e "${YELLOW}Stopping Docker services...${NC}"
    docker compose down 2>/dev/null
    
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

start_service() {
    local name=$1
    local command=$2
    local port=$3

    echo -e "${YELLOW}Starting $name...${NC}"
    
    # For backend, kill any existing process on the port
    if [ "$name" = "Backend" ] && [ ! -z "$port" ] && port_in_use $port; then
        echo -e "${YELLOW}Port $port is in use. Attempting to kill existing process...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 2
    fi
    
    if [ ! -z "$port" ]; then
        if port_in_use $port; then
            if [ "$name" = "Frontend" ]; then
                port=$(find_next_port $port)
                echo -e "${YELLOW}Port $port is available for $name${NC}"
            else
                echo -e "${RED}Port $port is already in use. $name might be already running.${NC}"
                return 1
            fi
        fi
    fi

    command=$(echo "$command" | sed 's/python /python3 /')
    
    if [ "$name" = "Frontend" ]; then
        command="$command --port $port"
        # Set environment variable for React
        export PORT=$port
    fi
    
    eval "$command" &
    local pid=$!
    
    # Store the PID
    echo $pid > ".$name.pid"
    
    echo -e "${GREEN}$name started with PID: $pid${NC}"
    echo $port
    return 0
}

trap cleanup EXIT INT TERM

# Check if required commands exist
if ! command_exists python3; then
    echo -e "${RED}Python 3 is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}Node.js/npm is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command_exists redis-server; then
    echo -e "${RED}Redis is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command_exists docker; then
    echo -e "${RED}Docker is not installed. Please install it first.${NC}"
    exit 1
fi

# if ! command_exists "docker compose"; then
#     echo -e "${RED}Docker Compose is not installed. Please install it first.${NC}"
#     exit 1
# fi

# Clean up any existing services
echo -e "${YELLOW}Cleaning up existing processes...${NC}"
pkill -f "python3 run.py" 2>/dev/null
pkill -f "npm start" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
python3 -m pip install -r backend/requirements.txt

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd frontend
npm install
cd ..

# Start Redis
echo -e "${YELLOW}Starting Redis...${NC}"
start_service "Redis" "redis-server" 6379

# Start Docker services
echo -e "${YELLOW}Starting Docker services (PostgreSQL, Keycloak, MinIO)...${NC}"
docker compose down 2>/dev/null
docker compose up -d

# Wait for PostgreSQL
if ! wait_for_postgres; then
    echo -e "${RED}Failed to start PostgreSQL. Exiting...${NC}"
    exit 1
fi

# Wait longer for all Docker services to be ready
echo -e "${YELLOW}Waiting for Docker services to initialize...${NC}"
sleep 15

# Wait for Keycloak
echo -e "${YELLOW}Waiting for Keycloak to be ready...${NC}"
if check_service_health "http://localhost:8080/health/ready" 60; then
    echo -e "${GREEN}Keycloak is ready!${NC}"
else
    echo -e "${YELLOW}Keycloak health check failed, but continuing...${NC}"
fi

# Wait for MinIO
echo -e "${YELLOW}Waiting for MinIO to be ready...${NC}"
if check_service_health "http://localhost:9000/minio/health/live" 30; then
    echo -e "${GREEN}MinIO is ready!${NC}"
else
    echo -e "${YELLOW}MinIO health check failed, but continuing...${NC}"
fi

# Start backend services
echo -e "${YELLOW}Starting backend services...${NC}"
cd backend
start_service "Backend" "python3 run.py" 8000
cd ..

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend API to be ready...${NC}"
if check_service_health "http://localhost:8000/" 60; then
    echo -e "${GREEN}Backend API is ready!${NC}"
else
    echo -e "${RED}Backend API failed to start within timeout${NC}"
    exit 1
fi

# Start frontend
echo -e "${YELLOW}Starting frontend...${NC}"
cd frontend
# Clear any existing PORT environment variable
unset PORT
FRONTEND_PORT=$(start_service "Frontend" "npm start" 3000)
cd ..

# Wait for frontend to be ready with longer timeout
echo -e "${YELLOW}Waiting for frontend to be ready...${NC}"
sleep 10 
if check_service_health "http://localhost:$FRONTEND_PORT" 120; then
    echo -e "${GREEN}Frontend is ready!${NC}"
else
    echo -e "${RED}Frontend failed to start within timeout${NC}"
    echo -e "${YELLOW}Continuing anyway. Frontend might still be starting...${NC}"
fi

echo -e "${GREEN}All services started successfully!${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

echo -e "\n${GREEN}Service Links:${NC}"
echo -e "${YELLOW}Frontend:${NC} http://localhost:$FRONTEND_PORT"
echo -e "${YELLOW}Backend API:${NC} http://localhost:8000"
echo -e "${YELLOW}Backend API Docs:${NC} http://localhost:8000/docs"
echo -e "${YELLOW}Keycloak:${NC} http://localhost:8080"
echo -e "${YELLOW}MinIO Console:${NC} http://localhost:9001 (admin/minioadmin)"
echo -e "${YELLOW}Prometheus:${NC} http://localhost:9090"
echo -e "${YELLOW}Grafana:${NC} http://localhost:3001"

# Keep the script running
echo -e "\n${YELLOW}Services are running. Press Ctrl+C to stop...${NC}"
while true; do
    sleep 30
done