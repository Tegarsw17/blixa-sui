#!/bin/bash

# BLIXA MVP - WSL Quick Commands
# Kumpulan command yang sering dipakai untuk development di WSL

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

show_help() {
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║         BLIXA MVP - WSL Quick Commands                       ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Usage: ./wsl-commands.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup         - Run full setup"
    echo "  start         - Start backend & frontend"
    echo "  stop          - Stop all services"
    echo "  restart       - Restart all services"
    echo "  db-reset      - Reset database"
    echo "  db-migrate    - Run migrations"
    echo "  sui-build     - Build Sui contract"
    echo "  sui-publish   - Publish Sui contract"
    echo "  clean         - Clean node_modules"
    echo "  logs          - Show logs"
    echo "  status        - Check services status"
    echo ""
}

setup() {
    echo -e "${GREEN}Running setup...${NC}"
    chmod +x setup-wsl.sh
    ./setup-wsl.sh
}

start_services() {
    echo -e "${GREEN}Starting services...${NC}"
    
    # Start PostgreSQL
    echo -e "${YELLOW}→ Starting PostgreSQL...${NC}"
    sudo service postgresql start
    
    # Start backend in background
    echo -e "${YELLOW}→ Starting backend...${NC}"
    cd backend
    npm run dev > ../logs/backend.log 2>&1 &
    echo $! > ../logs/backend.pid
    cd ..
    
    # Start frontend in background
    echo -e "${YELLOW}→ Starting frontend...${NC}"
    cd frontend
    npm run dev > ../logs/frontend.log 2>&1 &
    echo $! > ../logs/frontend.pid
    cd ..
    
    echo -e "${GREEN}✓ Services started${NC}"
    echo "Backend: http://localhost:3001"
    echo "Frontend: http://localhost:3000"
    echo ""
    echo "View logs: ./wsl-commands.sh logs"
}

stop_services() {
    echo -e "${GREEN}Stopping services...${NC}"
    
    # Stop backend
    if [ -f logs/backend.pid ]; then
        kill $(cat logs/backend.pid) 2>/dev/null
        rm logs/backend.pid
        echo -e "${YELLOW}→ Backend stopped${NC}"
    fi
    
    # Stop frontend
    if [ -f logs/frontend.pid ]; then
        kill $(cat logs/frontend.pid) 2>/dev/null
        rm logs/frontend.pid
        echo -e "${YELLOW}→ Frontend stopped${NC}"
    fi
    
    echo -e "${GREEN}✓ Services stopped${NC}"
}

restart_services() {
    stop_services
    sleep 2
    start_services
}

db_reset() {
    echo -e "${GREEN}Resetting database...${NC}"
    cd backend
    npm run prisma:migrate reset
    npm run prisma:generate
    npm run prisma:migrate
    cd ..
    echo -e "${GREEN}✓ Database reset complete${NC}"
}

db_migrate() {
    echo -e "${GREEN}Running migrations...${NC}"
    cd backend
    npm run prisma:generate
    npm run prisma:migrate
    cd ..
    echo -e "${GREEN}✓ Migrations complete${NC}"
}

sui_build() {
    echo -e "${GREEN}Building Sui contract...${NC}"
    cd sui-contract
    sui move build
    cd ..
    echo -e "${GREEN}✓ Contract built${NC}"
}

sui_publish() {
    echo -e "${GREEN}Publishing Sui contract...${NC}"
    cd sui-contract
    sui client publish --gas-budget 100000000
    cd ..
    echo -e "${YELLOW}→ Copy Package ID to backend/.env${NC}"
}

clean() {
    echo -e "${GREEN}Cleaning node_modules...${NC}"
    rm -rf backend/node_modules
    rm -rf frontend/node_modules
    echo -e "${GREEN}✓ Cleaned${NC}"
    echo "Run: npm install in backend and frontend"
}

show_logs() {
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    Service Logs                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "=== Backend Logs ==="
    tail -n 20 logs/backend.log 2>/dev/null || echo "No backend logs"
    echo ""
    echo "=== Frontend Logs ==="
    tail -n 20 logs/frontend.log 2>/dev/null || echo "No frontend logs"
}

check_status() {
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                  Services Status                             ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    
    # PostgreSQL
    if sudo service postgresql status | grep -q "online"; then
        echo -e "${GREEN}✓ PostgreSQL: Running${NC}"
    else
        echo -e "${YELLOW}✗ PostgreSQL: Stopped${NC}"
    fi
    
    # Backend
    if [ -f logs/backend.pid ] && kill -0 $(cat logs/backend.pid) 2>/dev/null; then
        echo -e "${GREEN}✓ Backend: Running (PID: $(cat logs/backend.pid))${NC}"
    else
        echo -e "${YELLOW}✗ Backend: Stopped${NC}"
    fi
    
    # Frontend
    if [ -f logs/frontend.pid ] && kill -0 $(cat logs/frontend.pid) 2>/dev/null; then
        echo -e "${GREEN}✓ Frontend: Running (PID: $(cat logs/frontend.pid))${NC}"
    else
        echo -e "${YELLOW}✗ Frontend: Stopped${NC}"
    fi
    
    echo ""
    echo "Ports:"
    echo "  Backend:  http://localhost:3001"
    echo "  Frontend: http://localhost:3000"
}

# Create logs directory if not exists
mkdir -p logs

# Main command handler
case "$1" in
    setup)
        setup
        ;;
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    db-reset)
        db_reset
        ;;
    db-migrate)
        db_migrate
        ;;
    sui-build)
        sui_build
        ;;
    sui-publish)
        sui_publish
        ;;
    clean)
        clean
        ;;
    logs)
        show_logs
        ;;
    status)
        check_status
        ;;
    *)
        show_help
        ;;
esac
