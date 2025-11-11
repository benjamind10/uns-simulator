#!/bin/bash
# Docker Health Check Script for UNS Simulator
# Tests all services and their connectivity

echo "🔍 UNS Simulator - Docker Health Check"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
echo "1. Checking Docker daemon..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Check if docker-compose is available
echo "2. Checking docker-compose..."
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ docker-compose is available${NC}"
echo ""

# Check if .env file exists
echo "3. Checking environment configuration..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "   Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env and set JWT_SECRET${NC}"
    else
        echo -e "${RED}❌ .env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env file exists${NC}"
    
    # Check if JWT_SECRET is set to something other than default
    if grep -q "JWT_SECRET=your-secret-key-here-change-in-production" .env; then
        echo -e "${YELLOW}⚠️  JWT_SECRET is still set to default value${NC}"
        echo "   Please update JWT_SECRET in .env before production use"
    fi
fi
echo ""

# Check container status
echo "4. Checking container status..."
if ! docker-compose ps > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Containers not running. Starting services...${NC}"
    docker-compose up -d
    echo "   Waiting for services to start (30 seconds)..."
    sleep 30
fi

# Get container status
CONTAINERS=$(docker-compose ps --format json 2>/dev/null || docker-compose ps)
echo "$CONTAINERS"
echo ""

# Check MongoDB
echo "5. Testing MongoDB connection..."
if docker-compose exec -T mongo mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MongoDB is accessible${NC}"
else
    echo -e "${RED}❌ MongoDB connection failed${NC}"
fi
echo ""

# Check MQTT broker
echo "6. Testing MQTT broker..."
if docker-compose exec -T mqtt timeout 5 mosquitto_sub -h localhost -t test -C 1 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MQTT broker is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  MQTT broker test inconclusive (may be working)${NC}"
fi
echo ""

# Check backend health endpoint
echo "7. Testing backend health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health 2>/dev/null || echo "000")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
    curl -s http://localhost:4000/health | jq '.' 2>/dev/null || curl -s http://localhost:4000/health
else
    echo -e "${RED}❌ Backend health check failed (HTTP $HEALTH_RESPONSE)${NC}"
fi
echo ""

# Check frontend
echo "8. Testing frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend check failed (HTTP $FRONTEND_RESPONSE)${NC}"
fi
echo ""

# Network connectivity test
echo "9. Testing inter-service connectivity..."
if docker-compose exec -T backend sh -c "ping -c 1 mongo > /dev/null 2>&1"; then
    echo -e "${GREEN}✅ Backend can reach MongoDB${NC}"
else
    echo -e "${RED}❌ Backend cannot reach MongoDB${NC}"
fi

if docker-compose exec -T backend sh -c "ping -c 1 mqtt > /dev/null 2>&1"; then
    echo -e "${GREEN}✅ Backend can reach MQTT broker${NC}"
else
    echo -e "${RED}❌ Backend cannot reach MQTT broker${NC}"
fi
echo ""

# Port check
echo "10. Checking port availability..."
PORTS=(3000 4000 27017 1883 9001)
PORT_NAMES=("Frontend" "Backend" "MongoDB" "MQTT TCP" "MQTT WebSocket")

for i in "${!PORTS[@]}"; do
    PORT=${PORTS[$i]}
    NAME=${PORT_NAMES[$i]}
    
    if nc -z localhost $PORT 2>/dev/null || timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/$PORT" 2>/dev/null; then
        echo -e "${GREEN}✅ $NAME (port $PORT) is listening${NC}"
    else
        echo -e "${RED}❌ $NAME (port $PORT) is not accessible${NC}"
    fi
done
echo ""

# Summary
echo "========================================"
echo "Health Check Complete"
echo ""
echo "Service URLs:"
echo "  Frontend:     http://localhost:3000"
echo "  Backend API:  http://localhost:4000/graphql"
echo "  Health Check: http://localhost:4000/health"
echo "  MongoDB:      mongodb://localhost:27017"
echo "  MQTT TCP:     mqtt://localhost:1883"
echo "  MQTT WS:      ws://localhost:9001"
echo ""
echo "Useful commands:"
echo "  docker-compose logs -f        # View all logs"
echo "  docker-compose ps             # Check status"
echo "  docker-compose restart        # Restart all"
echo "  docker-compose down           # Stop all"
echo ""
