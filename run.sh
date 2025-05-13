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


find_next_port() {
    local port=$1
    while port_in_use $port; do
        port=$((port + 1))
    done
    echo $port
}


start_service() {
    local name=$1
    local command=$2
    local port=$3

    echo -e "${YELLOW}Starting $name...${NC}"
    
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
    fi
    
    eval "$command" &
    local pid=$!
    
    # Store the PID
    echo $pid > ".$name.pid"
    
    echo -e "${GREEN}$name started with PID: $pid${NC}"
    echo $port
    return 0
}

cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    
    echo -e "${YELLOW}Stopping Docker services...${NC}"
    docker compose down
    
    for pid_file in .*.pid; do
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file")
            echo -e "${YELLOW}Stopping process with PID: $pid${NC}"
            kill $pid 2>/dev/null
            rm "$pid_file"
        fi
    done
    
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
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

if ! command_exists docker compose; then
    echo -e "${RED}Docker Compose is not installed. Please install it first.${NC}"
    exit 1
fi

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
pip install -r backend/requirements.txt

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd frontend
npm install
cd ..

# Start Redis
start_service "Redis" "redis-server" 6379

# Start Keycloak and PostgreSQL using Docker Compose
echo -e "${YELLOW}Starting Keycloak and PostgreSQL...${NC}"
docker compose up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Start backend services
echo -e "${YELLOW}Starting backend services...${NC}"
cd backend
start_service "Backend" "python3 run.py" 8000
cd ..

# Start frontend
echo -e "${YELLOW}Starting frontend...${NC}"
cd frontend
FRONTEND_PORT=$(start_service "Frontend" "npm start" 3000)
cd ..

echo -e "${GREEN}All services started!${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

echo -e "\n${GREEN}Service Links:${NC}"
echo -e "${YELLOW}Frontend:${NC} http://localhost:$FRONTEND_PORT"
echo -e "${YELLOW}Backend API:${NC} http://localhost:8000"
echo -e "${YELLOW}Keycloak:${NC} http://localhost:8080"
echo -e "${YELLOW}Prometheus:${NC} http://localhost:9090"
echo -e "${YELLOW}Grafana:${NC} http://localhost:3001"
