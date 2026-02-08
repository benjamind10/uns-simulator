# UNS Simulator - Production-Ready Implementation Guide

**Purpose**: Single guide for implementing environment-driven configuration without hardcoded IPs/values. Adaptable to any OS.

---

## Overview

Convert UNS Simulator from hardcoded IP configuration (e.g., `YOUR_IP_HERE`) to environment-driven configuration using `.env` file.

**Result**: Single codebase that works on localhost, any IP, any domain, any OS (Linux/Mac/Windows).

---

## Prerequisites

- Docker & Docker Compose installed
- Git repository cloned
- Text editor for `.env` file
- Internet access to pull Docker images

---

## Step 1: Code Changes (3 Files)

### 1.1 Backend CORS & Security Headers
**File**: `server/src/index.ts`

**Changes**: Lines 79, 84, 93

```typescript
// OLD (Line 79):
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', ...];

// NEW (Line 79):
const frontendUrl = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:9071';
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:9071',
  frontendUrl,
  'https://studio.apollographql.com',
  process.env.CLIENT_URL,
].filter(Boolean);

// OLD (Line 93):
app.use(helmet());

// NEW (Line 93):
const isProduction = process.env.NODE_ENV === 'production';
app.use(
  helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginEmbedderPolicy: isProduction,
    crossOriginOpenerPolicy: isProduction ? { policy: 'same-origin' } : false,
    crossOriginResourcePolicy: isProduction ? { policy: 'cross-origin' } : false,
  })
);
```

**Why**: CORS origins and security headers configured from environment, not hardcoded.

---

### 1.2 Frontend MQTT Configuration
**File**: `client/src/store/mqtt/mqttClientManager.ts`

**Changes**: Lines 12-19 (function `getBrowserAccessibleUrl`)

```typescript
// OLD:
function getBrowserAccessibleUrl(brokerUrl: string): string {
  const dockerServiceMappings: Record<string, string> = {
    'uns-mqtt': 'YOUR_IP_HERE',  // HARDCODED IP
    'mqtt': 'YOUR_IP_HERE',
    'mosquitto': 'YOUR_IP_HERE',
    'localhost': 'YOUR_IP_HERE',
  };
  return dockerServiceMappings[brokerUrl] || brokerUrl;
}

// NEW:
function getBrowserAccessibleUrl(brokerUrl: string): string {
  const mqttServerUrl = import.meta.env.VITE_MQTT_SERVER_URL || window.location.hostname;
  
  const dockerServiceMappings: Record<string, string> = {
    'uns-mqtt': mqttServerUrl,
    'mqtt': mqttServerUrl,
    'mosquitto': mqttServerUrl,
    'localhost': mqttServerUrl,
  };
  return dockerServiceMappings[brokerUrl] || brokerUrl;
}
```

**Why**: MQTT server URL comes from environment variable, not hardcoded.

---

### 1.3 Docker Compose Configuration
**File**: `docker-compose.yml`

**Changes**: Frontend service build args and Backend environment variables

```yaml
# OLD Frontend Service:
frontend:
  build:
    context: ./client
    dockerfile: Dockerfile

# NEW Frontend Service:
frontend:
  build:
    context: ./client
    dockerfile: Dockerfile
    args:
      - VITE_API_URL=${VITE_API_URL:-http://localhost:9071/graphql}
      - VITE_MQTT_SERVER_URL=${VITE_MQTT_SERVER_URL:-localhost}

# OLD Backend Service (abbreviated):
backend:
  environment:
    - NODE_ENV=production
    - PORT=4000

# NEW Backend Service (complete):
backend:
  environment:
    - NODE_ENV=${NODE_ENV:-production}
    - PORT=4000
    - MONGO_URI=${MONGO_URI:-mongodb://mongo:27017/unsdb}
    - DB_NAME=${DB_NAME:-unsdb}
    - JWT_SECRET=${JWT_SECRET:-your-super-secret-jwt-key-change-this-in-production}
    - FRONTEND_PUBLIC_URL=${FRONTEND_PUBLIC_URL:-http://localhost:9071}
    - CLIENT_URL=${CLIENT_URL:-http://localhost:3000}
    - ENABLE_RATE_LIMIT=${ENABLE_RATE_LIMIT:-false}
    - MQTT_HOST=${MQTT_HOST:-mqtt}
    - MQTT_PORT=${MQTT_PORT:-1883}
    - MQTT_BACKBONE_USERNAME=${MQTT_BACKBONE_USERNAME:-uns-backend}
    - MQTT_BACKBONE_PASSWORD=${MQTT_BACKBONE_PASSWORD:-uns-backend-dev}
```

**Why**: All configuration values come from environment variables with sensible defaults.

---

## Step 2: Create `.env` File

**Location**: Project root (same directory as `docker-compose.yml`)

### For Local Development (No Setup Needed)

```bash
# Copy template
cp .env.example .env

# That's it! Use defaults for localhost
```

### For Network IP (e.g., 192.168.1.100)

```bash
# Copy template
cp .env.example .env

# Edit .env file:
NODE_ENV=production
FRONTEND_PUBLIC_URL=http://192.168.1.100:9071
VITE_API_URL=http://192.168.1.100:9071/graphql
VITE_MQTT_SERVER_URL=192.168.1.100
```

### For Production (HTTPS Domain)

```bash
# Copy template
cp .env.example .env

# Edit .env file:
NODE_ENV=production
FRONTEND_PUBLIC_URL=https://simulator.example.com
VITE_API_URL=https://simulator.example.com/graphql
VITE_MQTT_SERVER_URL=simulator.example.com
JWT_SECRET=$(openssl rand -base64 32)  # Generate on your OS
MQTT_BACKBONE_PASSWORD=$(openssl rand -base64 16)
```

---

## Step 3: Environment Variables Reference

All variables use `${VAR:-default}` format (environment variable or default).

### Critical Variables
| Variable | Default | Required? | Purpose |
|----------|---------|-----------|---------|
| `NODE_ENV` | `production` | No | Controls security headers |
| `FRONTEND_PUBLIC_URL` | `http://localhost:9071` | Yes (non-localhost) | CORS origins |
| `VITE_API_URL` | `http://localhost:9071/graphql` | Yes (non-localhost) | GraphQL endpoint |
| `VITE_MQTT_SERVER_URL` | `localhost` | Yes (non-localhost) | MQTT server for browser |

### Production Variables
| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | JWT signing key (must be changed!) |
| `MQTT_BACKBONE_PASSWORD` | MQTT broker password |

### All Variables (30+)
See `.env.example` for complete reference.

---

## Step 4: Build & Deploy

### Linux / macOS / WSL
```bash
cd /path/to/uns-simulator

# Create and edit .env
cp .env.example .env
nano .env  # or vi .env

# Build and start
docker-compose down          # Stop old containers
docker-compose up -d --build # Build new images and start
docker-compose ps            # Check status (should all be healthy)
```

### Windows (PowerShell)
```powershell
cd C:\path\to\uns-simulator

# Create and edit .env
Copy-Item .env.example .env
notepad .env  # or use your editor

# Build and start
docker-compose down
docker-compose up -d --build
docker-compose ps
```

### Windows (Git Bash)
```bash
cd /c/path/to/uns-simulator
cp .env.example .env
nano .env
docker-compose down
docker-compose up -d --build
docker-compose ps
```

---

## Step 5: Verify Setup

```bash
# Check all containers healthy
docker-compose ps
# All should show "healthy" or "Up"

# Test backend health
curl http://localhost:4000/health
# Should return: {"status":"ok","environment":"production",...}

# Test GraphQL
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
# Should return: {"data":{"__typename":"Query"}}

# Test frontend
curl http://localhost:9071
# Should return HTML content

# View logs for errors
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongo
docker-compose logs mqtt
```

---

## Step 6: Access Application

### Local Access
- Frontend: http://localhost:9071
- GraphQL: http://localhost:4000/graphql
- Health: http://localhost:4000/health

### Network Access (if FRONTEND_PUBLIC_URL=http://192.168.1.100:9071)
- Frontend: http://192.168.1.100:9071
- GraphQL: http://192.168.1.100:4000/graphql
- Health: http://192.168.1.100:4000/health

### Production Access (if domain=simulator.example.com with HTTPS)
- Frontend: https://simulator.example.com
- Behind reverse proxy (nginx/Apache) with SSL certificate

---

## Troubleshooting

### Containers Won't Start
```bash
# Check logs
docker-compose logs

# Rebuild from scratch
docker-compose down -v  # Remove volumes
docker-compose up -d --build

# Check .env file exists and has correct values
cat .env
```

### CORS Errors in Browser
```bash
# Verify FRONTEND_PUBLIC_URL matches your actual URL
cat .env | grep FRONTEND_PUBLIC_URL

# If wrong, update and rebuild:
# Edit .env, then:
docker-compose up -d --build backend
```

### MQTT Connection Fails
```bash
# Check MQTT broker is running
docker-compose ps mqtt
# Should show "healthy"

# Check VITE_MQTT_SERVER_URL in .env
cat .env | grep VITE_MQTT_SERVER_URL

# Should be accessible from browser
# If using IP: http://YOUR_IP:9001
# If using domain: ws://YOUR_DOMAIN:9001
```

### Frontend Blank or Loading Forever
```bash
# Check frontend logs
docker-compose logs frontend

# Check VITE_API_URL is correct
docker-compose logs frontend | grep VITE_API_URL

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Database Connection Error
```bash
# Check MongoDB is running
docker-compose ps mongo
# Should show "healthy"

# Check MONGO_URI in .env
cat .env | grep MONGO_URI

# For Docker: should be mongodb://mongo:27017/unsdb
# NOT mongodb://localhost:27017/unsdb
```

---

## Security Notes

### For Development
- `NODE_ENV=development` (optional)
- Default secrets are fine for local testing
- Relaxed security headers

### For Production
**MUST DO:**
1. Set `NODE_ENV=production`
2. Generate secure `JWT_SECRET`:
   ```bash
   # Linux/macOS/WSL:
   openssl rand -base64 32
   
   # Windows (using online tool or):
   # Use: https://www.random.org/ or similar
   ```
3. Generate secure `MQTT_BACKBONE_PASSWORD`:
   ```bash
   openssl rand -base64 16
   ```
4. Use HTTPS (reverse proxy with SSL certificate)
5. Store `.env` securely (not in git)
6. Rotate secrets every 90 days

---

## OS-Specific Notes

### Linux
- Use `apt-get`, `yum`, or `pacman` to install Docker
- File paths use `/` (forward slash)
- Use `nano` or `vi` for editing `.env`
- Commands: `openssl rand -base64 32`

### macOS
- Use `brew install docker`
- File paths use `/` (forward slash)
- Use `nano` or `vi` for editing `.env`
- Commands: `openssl rand -base64 32`

### Windows (PowerShell)
- Use WSL2 for Docker (recommended)
- File paths use `\` (backslash) or `C:\`
- Use `notepad`, `code`, or `vim` for editing `.env`
- For random string: Use online tool or WSL bash with `openssl`

### Windows (WSL2/Git Bash)
- File paths use `/` (forward slash)
- Commands same as Linux
- `openssl` available in WSL/Git Bash

---

## Complete Workflow Example

### Scenario: Deploy to YOUR_IP_HERE (Your Current IP)

```bash
# 1. Clone/navigate to project
cd /path/to/uns-simulator

# 2. Create .env
cp .env.example .env

# 3. Edit .env (Linux/macOS)
nano .env
# Change:
#   FRONTEND_PUBLIC_URL=http://YOUR_IP_HERE:9071
#   VITE_API_URL=http://YOUR_IP_HERE:9071/graphql
#   VITE_MQTT_SERVER_URL=YOUR_IP_HERE

# OR Edit .env (Windows PowerShell)
notepad .env
# Make same changes

# 4. Build and start
docker-compose down
docker-compose up -d --build

# 5. Wait for services (1-2 minutes)
docker-compose ps
# All should be "healthy"

# 6. Test
curl http://localhost:4000/health

# 7. Access
# Open browser: http://YOUR_IP_HERE:9071
# Login: test@example.com / password123
```

---

## What Changed vs Old Setup

### Old Way
❌ IP `YOUR_IP_HERE` hardcoded in 3 files  
❌ Different code needed for different environments  
❌ Can't run on localhost or other IPs without code changes  

### New Way
✅ All configuration in `.env` file  
✅ Same code works everywhere  
✅ Change `.env`, rebuild, done  
✅ Supports localhost, any IP, any domain  
✅ Production-ready with security headers  

---

## Validation Checklist

After implementing:

- [ ] 3 code files edited (server/src/index.ts, client/src/store/mqtt/mqttClientManager.ts, docker-compose.yml)
- [ ] `.env` file created from `.env.example`
- [ ] `.env` has correct values for your environment
- [ ] `docker-compose down` ran
- [ ] `docker-compose up -d --build` completed successfully
- [ ] `docker-compose ps` shows all services healthy
- [ ] `curl http://localhost:4000/health` returns JSON
- [ ] `curl http://localhost:9071` returns HTML
- [ ] Frontend accessible at configured URL
- [ ] Login works with test@example.com / password123
- [ ] MQTT broker connection works
- [ ] Simulations can run

---

## Next Steps

1. **For Team**: Share this guide with your team
2. **For Deployment**: Follow "Complete Workflow Example" above
3. **For Other Environments**: Change `.env` values, rebuild, repeat
4. **For Production**: Generate secure secrets, set NODE_ENV=production, use HTTPS

---

## Summary

**One file changed**: `.env` - Your environment configuration  
**Three code files changed**: Lines indicated above  
**Result**: Production-ready, environment-driven, OS-agnostic setup

Deploy to any OS, any IP, any domain by changing `.env` only.
