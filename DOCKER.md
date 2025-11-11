# 🐳 Docker Deployment Guide - UNS Simulator

Complete guide for running the UNS Simulator stack in Docker with MongoDB, MQTT broker, backend API, and frontend.

---

## Table of Contents

- [Quick Start](#quick-start)
- [What's Included](#whats-included)
- [Architecture](#architecture)
- [Common Commands](#common-commands)
- [Service Endpoints](#service-endpoints)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)
- [Implementation Details](#implementation-details)

---

## Quick Start

```powershell
# 1. Create environment file
cp .env.example .env

# 2. Edit .env and set your JWT_SECRET
notepad .env

# 3. Start all services
docker-compose up -d

# 4. Run health check (optional)
.\docker-health-check.ps1

# 5. Open application
# Browser: http://localhost:3000
```

**Note:** If you get a "port already in use" error, stop any locally running backend/frontend servers first.

---

## What's Included

The Docker stack includes 4 services running on the `uns-network`:

1. **MongoDB** (port 27017) - Database
2. **Eclipse Mosquitto** (ports 1883 TCP, 9001 WebSocket) - MQTT broker
3. **Backend API** (port 4000) - Node.js GraphQL server
4. **Frontend** (port 3000) - React application served by nginx

All services have:

- ✅ Health checks with automatic restart
- ✅ Proper startup dependencies
- ✅ Persistent data volumes
- ✅ Inter-service communication

---

## Architecture

```
Docker Network: uns-network (bridge)

┌─────────────────────────────────────────────┐
│  uns-network                                │
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

**Service Dependencies:**

1. MongoDB and MQTT start first (in parallel)
2. Backend waits for MongoDB + MQTT to be healthy
3. Frontend waits for backend to be healthy

---

## Common Commands

### Starting the Stack

```powershell
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

### Checking Service Status

```powershell
# View all container status
docker-compose ps

# Check health of services
docker-compose ps | findstr healthy

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongo
docker-compose logs -f mqtt
```

### Managing Services

```powershell
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

### Debugging

```powershell
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

### Cleanup

```powershell
# Stop and remove containers (keeps volumes)
docker-compose down

# Remove containers and volumes (deletes data!)
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a

# Remove only unused volumes
docker volume prune
```

---

## Service Endpoints

| Service  | Internal URL            | External URL                   | Purpose        |
| -------- | ----------------------- | ------------------------------ | -------------- |
| MongoDB  | `mongodb://mongo:27017` | `mongodb://localhost:27017`    | Database       |
| MQTT TCP | `mqtt://mqtt:1883`      | `mqtt://localhost:1883`        | MQTT broker    |
| MQTT WS  | `ws://mqtt:9001`        | `ws://localhost:9001`          | MQTT WebSocket |
| Backend  | `http://backend:4000`   | `http://localhost:4000`        | GraphQL API    |
| Frontend | `http://frontend:80`    | `http://localhost:3000`        | React app      |
| Health   | -                       | `http://localhost:4000/health` | Backend health |

**Internal URLs:** Used by services inside Docker network  
**External URLs:** Used from host machine or browser

---

## Troubleshooting

### Port Already in Use Error

**Error:** `bind: Only one usage of each socket address is normally permitted`

This means you have a service (backend or frontend) still running locally on your laptop.

```powershell
# Check what's using the ports
Get-NetTCPConnection -LocalPort 3000,4000 -ErrorAction SilentlyContinue

# Find the process
Get-Process -Id <ProcessId>

# Stop the process
Stop-Process -Id <ProcessId> -Force

# Or stop all Node processes
Get-Process node | Stop-Process -Force
```

### Services Won't Start

```powershell
# Check logs for errors
docker-compose logs backend
docker-compose logs frontend

# Rebuild from scratch
docker-compose down
docker-compose up -d --build
```

### Health Checks Failing

```powershell
# Wait for health checks (can take 30-60 seconds)
docker-compose ps

# Check specific health check
docker inspect --format='{{json .State.Health}}' uns-backend
docker inspect --format='{{json .State.Health}}' uns-frontend

# Force restart unhealthy service
docker-compose restart backend
```

### Can't Connect to Backend

```powershell
# Verify backend is running
docker-compose ps backend

# Check backend logs
docker-compose logs backend

# Verify MONGO_URI in .env uses service name
# Should be: MONGO_URI=mongodb://mongo:27017
# NOT: MONGO_URI=mongodb://localhost:27017

# Test health endpoint
curl http://localhost:4000/health
```

### MongoDB Connection Failed

```powershell
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

```powershell
# Check MQTT broker is running
docker-compose ps mqtt

# Check MQTT logs
docker-compose logs mqtt

# Test MQTT broker
docker-compose exec mqtt mosquitto_sub -h localhost -t test -C 1

# Check WebSocket port (should see "Websocket client" in logs)
docker-compose logs -f mqtt | findstr websocket
```

### Frontend Shows "Cannot Connect to API"

```powershell
# Check if backend is healthy
curl http://localhost:4000/health

# Verify frontend was built with correct API URL
# Should have VITE_API_URL=http://localhost:4000 in docker-compose.yml

# Rebuild frontend
docker-compose up -d --build frontend
```

---

## Development Workflow

```powershell
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

---## Production Deployment

````bash
# 1. Set production environment
export NODE_ENV=production

# 2. Create production .env
---

## Production Deployment

### Security Checklist

Before deploying to production:

- [ ] Set strong `JWT_SECRET` (32+ random characters)
- [ ] Enable rate limiting (`ENABLE_RATE_LIMIT=true`)
- [ ] Configure MQTT authentication (disable `allow_anonymous` in `mosquitto.conf`)
- [ ] Use HTTPS/WSS for client connections
- [ ] Set `NODE_ENV=production`
- [ ] Review and restrict CORS allowed origins

### Performance Optimization

- [ ] Allocate more memory to MongoDB if needed
- [ ] Monitor with `docker stats`
- [ ] Set up log rotation for MQTT logs
- [ ] Consider using Docker secrets for sensitive values

### Reliability

- [ ] Set up automated MongoDB backups
- [ ] Configure health check monitoring/alerting
- [ ] Use Docker Swarm or Kubernetes for HA
- [ ] Set up log aggregation (e.g., ELK stack)

### Networking

- [ ] Configure reverse proxy (nginx/Traefik) for SSL termination
- [ ] Set up proper DNS names instead of localhost
- [ ] Configure firewall rules
- [ ] Use separate Docker networks for isolation

### Deployment Steps

```powershell
# 1. Set production environment
$env:NODE_ENV="production"

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
````

---

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

---

## Implementation Details

### What Was Fixed

This Docker stack was completely overhauled to fix several critical issues:

**Before:**

- Services couldn't communicate (no shared network)
- Port mismatches (backend 5000 vs 4000, MQTT WS 1884 vs 9001)
- No health checks (services started before dependencies ready)
- No health endpoint on backend
- No environment template

**After:**

- All services on `uns-network` bridge network
- Consistent ports everywhere (backend 4000, MQTT WS 9001)
- Comprehensive health checks for all 4 services
- `/health` endpoint returns database status, uptime, environment
- `.env.example` template with documentation

### Service Health Checks

Each service has a health check configured:

- **MongoDB**: `mongosh --eval "db.adminCommand('ping')"`
- **MQTT**: `mosquitto_sub -t '$SYS/#' -C 1`
- **Backend**: `wget http://localhost:4000/health`
- **Frontend**: `wget http://localhost:80/`

Health checks run every 30 seconds with 3 retries and 5-second timeout.

### Startup Dependencies

Services start in order with health check conditions:

1. MongoDB and MQTT start first (parallel)
2. Backend waits for MongoDB + MQTT to be healthy
3. Frontend waits for backend to be healthy

This ensures proper initialization and prevents connection errors.

### Data Persistence

Three volumes are created for persistent data:

- `mongo-data` - MongoDB database files
- `mqtt-data` - MQTT broker data
- `mqtt-logs` - MQTT broker logs

Data persists across container restarts. Use `docker-compose down -v` to remove.

### Volume Management

```powershell
# List volumes
docker volume ls

# Inspect volume
docker volume inspect uns-simulator_mongo-data

# Backup MongoDB volume
docker run --rm -v uns-simulator_mongo-data:/data -v ${PWD}:/backup mongo:6 tar czf /backup/mongo-backup.tar.gz /data

# Restore MongoDB volume
docker run --rm -v uns-simulator_mongo-data:/data -v ${PWD}:/backup mongo:6 tar xzf /backup/mongo-backup.tar.gz -C /
```

---

## Support & Resources

- **Quick Start**: See top of this document
- **Troubleshooting**: See [Troubleshooting](#troubleshooting) section above
- **Health Check Script**: Run `.\docker-health-check.ps1` to diagnose issues
- **Environment Config**: See `.env.example` for required variables
- **Changelog**: See `CHANGELOG.md` for recent changes

---

**Implementation Date:** November 10, 2025  
**Status:** ✅ Production Ready  
**Last Updated:** November 11, 2025
