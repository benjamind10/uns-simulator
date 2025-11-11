# Docker Quick Reference - UNS Simulator

## Starting the Stack

```bash
# First time setup
cp .env.example .env
# Edit .env and set JWT_SECRET

# Start all services
docker-compose up -d

# Start with live logs
docker-compose up

# Rebuild and start (after code changes)
docker-compose up -d --build
```

## Checking Service Status

```bash
# View all container status
docker-compose ps

# Check health of services
docker-compose ps | grep healthy

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongo
docker-compose logs -f mqtt
```

## Managing Services

```bash
# Stop all services (keeps data)
docker-compose down

# Stop and remove volumes (WARNING: deletes all data!)
docker-compose down -v

# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend

# Stop specific service
docker-compose stop frontend

# Start specific service
docker-compose start frontend
```

## Accessing Services

- **Frontend**: http://localhost:3000
- **Backend GraphQL**: http://localhost:4000/graphql
- **Backend Health**: http://localhost:4000/health
- **MongoDB**: mongodb://localhost:27017
- **MQTT TCP**: localhost:1883
- **MQTT WebSocket**: ws://localhost:9001

## Debugging

```bash
# Execute command in running container
docker-compose exec backend sh
docker-compose exec frontend sh

# View backend health check
curl http://localhost:4000/health

# Test MongoDB connection
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"

# Test MQTT broker
docker-compose exec mqtt mosquitto_sub -t '$SYS/#' -C 1

# View container resource usage
docker stats

# Inspect container
docker inspect uns-backend
```

## Cleanup

```bash
# Stop and remove containers (keeps volumes)
docker-compose down

# Remove containers and volumes (deletes data!)
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a

# Remove only unused volumes
docker volume prune
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs for errors
docker-compose logs backend
docker-compose logs frontend

# Check if ports are already in use
# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 3000,4000,27017,1883,9001

# Linux/Mac
lsof -i :3000
lsof -i :4000
lsof -i :27017
lsof -i :1883
lsof -i :9001
```

### Health Checks Failing

```bash
# Wait for health checks (can take 30-60 seconds)
docker-compose ps

# Check specific health check
docker inspect --format='{{json .State.Health}}' uns-backend
docker inspect --format='{{json .State.Health}}' uns-frontend

# Force restart unhealthy service
docker-compose restart backend
```

### Can't Connect to Backend

```bash
# Verify backend is running
docker-compose ps backend

# Check backend logs
docker-compose logs backend

# Verify MONGO_URI in .env
# Should be: MONGO_URI=mongodb://mongo:27017

# Test health endpoint
curl http://localhost:4000/health
```

### MongoDB Connection Failed

```bash
# Check MongoDB is running
docker-compose ps mongo

# Check MongoDB logs
docker-compose logs mongo

# Test MongoDB connection
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"

# Verify network connectivity
docker-compose exec backend ping mongo
```

### MQTT Not Working

```bash
# Check MQTT broker is running
docker-compose ps mqtt

# Check MQTT logs
docker-compose logs mqtt

# Test MQTT broker
docker-compose exec mqtt mosquitto_sub -h localhost -t test -C 1

# Check WebSocket port
# Should see "Websocket client" in logs when connecting from browser
docker-compose logs -f mqtt | grep -i websocket
```

## Development Workflow

```bash
# 1. Make code changes in your editor

# 2. Rebuild only changed service
docker-compose up -d --build backend  # for server changes
docker-compose up -d --build frontend # for client changes

# 3. View logs to verify
docker-compose logs -f backend

# 4. Test changes
curl http://localhost:4000/health

# 5. If needed, restart service
docker-compose restart backend
```

## Production Deployment

```bash
# 1. Set production environment
export NODE_ENV=production

# 2. Create production .env
cp .env.example .env
# Edit .env with production values

# 3. Build production images
docker-compose build --no-cache

# 4. Start services
docker-compose up -d

# 5. Verify all healthy
docker-compose ps

# 6. Monitor logs
docker-compose logs -f
```

## Environment Variables

Required in `.env` file:

```env
# Server
NODE_ENV=production
PORT=4000
JWT_SECRET=change-this-to-secure-random-string
JWT_EXPIRES_IN=24h

# Database
MONGO_URI=mongodb://mongo:27017
DB_NAME=uns_simulator

# Client
CLIENT_URL=http://localhost:3000
VITE_API_URL=http://localhost:4000

# MQTT (for reference)
MQTT_HOST=mqtt
MQTT_PORT=1883
MQTT_WS_PORT=9001

# Rate Limiting (optional)
ENABLE_RATE_LIMIT=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Network Architecture

```
Docker Network: uns-network (bridge)

┌─────────────────────────────────────────────┐
│  uns-network (172.18.0.0/16)               │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  mongo   │  │   mqtt   │  │ backend  │ │
│  │  :27017  │  │ :1883    │  │  :4000   │ │
│  │          │  │ :9001 WS │  │          │ │
│  └────┬─────┘  └──────────┘  └────┬─────┘ │
│       │                            │       │
│       └────────────────┬───────────┘       │
│                        │                   │
│                  ┌─────▼──────┐            │
│                  │  frontend  │            │
│                  │   :80      │            │
│                  └────────────┘            │
└─────────────────────────────────────────────┘
          │              │              │
     Port 27017     Port 1883      Port 3000
                    Port 9001      Port 4000
                         │
                    Host Network
```

## Volumes

- `mongo-data` - MongoDB database files (persistent)
- `mqtt-data` - MQTT broker data (persistent)
- `mqtt-logs` - MQTT broker logs (persistent)

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect uns-simulator_mongo-data

# Backup MongoDB volume
docker run --rm -v uns-simulator_mongo-data:/data -v $(pwd):/backup \
  mongo:6 tar czf /backup/mongo-backup.tar.gz /data

# Restore MongoDB volume
docker run --rm -v uns-simulator_mongo-data:/data -v $(pwd):/backup \
  mongo:6 tar xzf /backup/mongo-backup.tar.gz -C /
```
