#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to start a service
start_service() {
    local name=$1
    local command=$2
    local port=$3

    echo -e "${YELLOW}Starting $name...${NC}"
    
    if [ ! -z "$port" ] && port_in_use $port; then
        echo -e "${RED}Port $port is already in use. $name might be already running.${NC}"
        return 1
    fi

    # Run the command in the background
    eval "$command" &
    local pid=$!
    
    # Store the PID
    echo $pid > ".$name.pid"
    
    echo -e "${GREEN}$name started with PID: $pid${NC}"
    return 0
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    
    # Kill all background processes
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

# Set up cleanup on script exit
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

# Start PostgreSQL
if command_exists pg_ctl; then
    start_service "PostgreSQL" "pg_ctl start -D /usr/local/var/postgres" 5432
else
    echo -e "${YELLOW}PostgreSQL not found in PATH. Please make sure it's running.${NC}"
fi

# Start Keycloak (if exists)
if [ -d "keycloak" ]; then
    start_service "Keycloak" "./keycloak/bin/standalone.sh" 8080
else
    echo -e "${YELLOW}Keycloak directory not found. Please make sure it's installed.${NC}"
fi

# Start backend services
echo -e "${YELLOW}Starting backend services...${NC}"
cd backend
start_service "Backend" "python run.py" 8000
cd ..

# Start frontend
echo -e "${YELLOW}Starting frontend...${NC}"
cd frontend
start_service "Frontend" "npm start" 3000
cd ..

echo -e "${GREEN}All services started!${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

read -p "Press Enter to stop all services..." 