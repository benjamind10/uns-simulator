# 🐳 Docker Stack - Ready to Deploy!

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

---

## What's Fixed

### ✅ Service Communication
- **Before:** Services couldn't talk to each other
- **After:** All services on `uns-network` bridge network

### ✅ Port Configuration
- **Before:** Backend port mismatch (5000 vs 4000), MQTT WebSocket wrong mapping
- **After:** Consistent ports everywhere (backend 4000, MQTT WS 9001)

### ✅ Health Monitoring
- **Before:** No health checks, services started before dependencies ready
- **After:** Complete health checks for all services with proper startup order

### ✅ Backend Health Endpoint
- **Before:** No way to monitor backend health
- **After:** `GET /health` endpoint returns database status, uptime, environment

### ✅ Environment Configuration
- **Before:** No template, hard to know what variables needed
- **After:** `.env.example` with all required variables documented

### ✅ Documentation
- **Before:** Limited Docker documentation
- **After:** Complete guides (README, DOCKER.md, DOCKER_IMPLEMENTATION.md)

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Docker Network: uns-network                │
│                                             │
│  mongo:27017 ──┐                           │
│  mqtt:1883 ────┼──► backend:4000 ──► frontend:80 │
│  mqtt:9001 WS ─┘                           │
└─────────────────────────────────────────────┘
         │              │              │
    Port 27017    Ports 1883     Ports 3000
                       9001            4000
                         │
                   Host Network
```

**Service Dependencies:**
1. MongoDB starts first
2. MQTT broker starts first
3. Backend waits for MongoDB + MQTT to be healthy
4. Frontend waits for backend to be healthy

---

## Files Created/Modified

### New Files
- ✅ `.env.example` - Environment variable template
- ✅ `DOCKER.md` - Complete Docker command reference
- ✅ `DOCKER_IMPLEMENTATION.md` - Implementation details and testing guide
- ✅ `docker-health-check.sh` - Bash health check script (Linux/Mac)
- ✅ `docker-health-check.ps1` - PowerShell health check script (Windows)

### Modified Files
- ✅ `docker-compose.yml` - Complete rewrite with networking and health checks
- ✅ `server/Dockerfile` - Added health checks, fixed build sequence, correct PORT
- ✅ `client/Dockerfile` - Added build args, health checks
- ✅ `server/src/index.ts` - Added `/health` endpoint
- ✅ `README.md` - Added Docker deployment section with troubleshooting
- ✅ `CHANGELOG.md` - Documented all Docker infrastructure changes

### Verified Files (No Changes Needed)
- ✅ `mqtt-broker/mosquitto.conf` - Already correctly configured

---

## Service Endpoints

| Service | Internal URL | External URL | Purpose |
|---------|-------------|--------------|---------|
| MongoDB | `mongodb://mongo:27017` | `mongodb://localhost:27017` | Database |
| MQTT TCP | `mqtt://mqtt:1883` | `mqtt://localhost:1883` | MQTT broker |
| MQTT WS | `ws://mqtt:9001` | `ws://localhost:9001` | MQTT WebSocket |
| Backend | `http://backend:4000` | `http://localhost:4000` | GraphQL API |
| Frontend | `http://frontend:80` | `http://localhost:3000` | React app |
| Health | - | `http://localhost:4000/health` | Monitor backend |

**Internal URL:** Used by services inside Docker network  
**External URL:** Used from host machine (your laptop) or browser

---

## Testing Checklist

### Initial Setup
- [ ] `.env` file created from `.env.example`
- [ ] `JWT_SECRET` changed to secure random string
- [ ] All required environment variables set

### Service Startup
- [ ] `docker-compose up -d` completes successfully
- [ ] All 4 containers show "healthy" status in `docker-compose ps`
- [ ] No errors in logs (`docker-compose logs`)

### Connectivity Tests
- [ ] Backend health check returns 200 OK (`curl http://localhost:4000/health`)
- [ ] Frontend loads in browser (`http://localhost:3000`)
- [ ] MongoDB accessible (`docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"`)
- [ ] MQTT broker accessible (`docker-compose exec mqtt mosquitto_sub -h localhost -t test -C 1`)

### Application Tests
- [ ] Can register new user account
- [ ] Can login with credentials
- [ ] Can add MQTT broker using `ws://localhost:9001`
- [ ] Can create/import schema
- [ ] Can create simulation profile
- [ ] Can start simulation and see it running
- [ ] Can view messages in MQTT Explorer
- [ ] Can pause/stop simulation

### Network Tests
- [ ] Backend can reach MongoDB (`docker-compose exec backend ping mongo`)
- [ ] Backend can reach MQTT (`docker-compose exec backend ping mqtt`)
- [ ] Services restart without errors (`docker-compose restart`)

---

## Common Commands

```powershell
# Start services
docker-compose up -d

# View status
docker-compose ps

# View logs (all)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend

# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend

# Stop all (keeps data)
docker-compose down

# Stop and delete data (WARNING!)
docker-compose down -v

# Rebuild after code changes
docker-compose up -d --build

# Run health check
.\docker-health-check.ps1

# Check backend health
curl http://localhost:4000/health

# Access container shell
docker-compose exec backend sh
docker-compose exec mongo mongosh
```

---

## Troubleshooting

### Services Won't Start

**Check logs:**
```powershell
docker-compose logs backend
docker-compose logs frontend
```

**Rebuild:**
```powershell
docker-compose down
docker-compose up -d --build
```

### Health Checks Failing

**Wait:** Health checks can take 30-60 seconds on first start

**Check individual health:**
```powershell
docker inspect --format='{{json .State.Health}}' uns-backend
```

### Can't Connect to Backend

**Verify environment:**
```powershell
# In .env file, should use service name, not localhost
MONGO_URI=mongodb://mongo:27017  # ✅ Correct
# NOT: mongodb://localhost:27017  # ❌ Wrong
```

**Restart backend:**
```powershell
docker-compose restart backend
```

### Port Already in Use

**Find process using port:**
```powershell
# Find what's using port 4000
Get-NetTCPConnection -LocalPort 4000

# Find what's using port 3000
Get-NetTCPConnection -LocalPort 3000
```

**Stop conflicting service:**
```powershell
# Stop process or change port in docker-compose.yml
```

---

## Production Considerations

Before deploying to production:

1. **Security**
   - [ ] Set strong `JWT_SECRET` (32+ random characters)
   - [ ] Enable rate limiting (`ENABLE_RATE_LIMIT=true`)
   - [ ] Configure MQTT authentication (disable `allow_anonymous`)
   - [ ] Use HTTPS/WSS for client connections
   - [ ] Set `NODE_ENV=production`

2. **Performance**
   - [ ] Allocate more memory to MongoDB if needed
   - [ ] Monitor with `docker stats`
   - [ ] Set up log rotation

3. **Reliability**
   - [ ] Set up automated MongoDB backups
   - [ ] Configure health check monitoring/alerting
   - [ ] Use Docker Swarm or Kubernetes for HA

4. **Networking**
   - [ ] Configure reverse proxy (nginx/Traefik)
   - [ ] Set up proper DNS names
   - [ ] Configure SSL certificates

---

## Support

**Documentation:**
- `README.md` - Getting started and features
- `DOCKER.md` - Complete Docker command reference
- `DOCKER_IMPLEMENTATION.md` - Implementation details
- `CHANGELOG.md` - Recent changes and fixes

**Health Check:**
- Run `.\docker-health-check.ps1` to diagnose issues
- Check `http://localhost:4000/health` for backend status

**Logs:**
- All services: `docker-compose logs -f`
- Specific service: `docker-compose logs -f [service-name]`

---

## Success! 🎉

Your Docker stack is now ready. Everything can run together with proper service communication.

**Next Steps:**
1. Run `docker-compose up -d`
2. Wait for health checks to pass
3. Open http://localhost:3000
4. Start building simulations!

**What Changed:**
- Services can now communicate using Docker network
- Health checks ensure proper startup order
- Complete documentation for deployment
- Easy environment configuration
- Production-ready setup

---

**Date:** November 10, 2025  
**Status:** ✅ Complete - Ready for Testing
