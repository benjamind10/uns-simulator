# Docker Health Check Script for UNS Simulator (PowerShell)
# Tests all services and their connectivity

Write-Host "🔍 UNS Simulator - Docker Health Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "1. Checking Docker daemon..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check if docker-compose is available
Write-Host "2. Checking docker-compose..." -ForegroundColor Yellow
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    Write-Host "✅ docker-compose is available" -ForegroundColor Green
} else {
    Write-Host "❌ docker-compose not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check if .env file exists
Write-Host "3. Checking environment configuration..." -ForegroundColor Yellow
if (-Not (Test-Path .env)) {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
        Write-Host "   Created .env from .env.example" -ForegroundColor Yellow
        Write-Host "⚠️  Please edit .env and set JWT_SECRET" -ForegroundColor Yellow
    } else {
        Write-Host "❌ .env.example not found" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    
    # Check if JWT_SECRET is set to default
    $envContent = Get-Content .env -Raw
    if ($envContent -match "JWT_SECRET=your-secret-key-here-change-in-production") {
        Write-Host "⚠️  JWT_SECRET is still set to default value" -ForegroundColor Yellow
        Write-Host "   Please update JWT_SECRET in .env before production use" -ForegroundColor Yellow
    }
}
Write-Host ""

# Check container status
Write-Host "4. Checking container status..." -ForegroundColor Yellow
try {
    $containerStatus = docker-compose ps 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Containers not running. Starting services..." -ForegroundColor Yellow
        docker-compose up -d
        Write-Host "   Waiting for services to start (30 seconds)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
    }
    docker-compose ps
} catch {
    Write-Host "❌ Failed to check container status" -ForegroundColor Red
}
Write-Host ""

# Check MongoDB
Write-Host "5. Testing MongoDB connection..." -ForegroundColor Yellow
try {
    $mongoTest = docker-compose exec -T mongo mongosh --quiet --eval "db.adminCommand('ping')" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MongoDB is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ MongoDB connection failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ MongoDB connection failed" -ForegroundColor Red
}
Write-Host ""

# Check MQTT broker
Write-Host "6. Testing MQTT broker..." -ForegroundColor Yellow
try {
    $mqttTest = docker-compose exec -T mqtt timeout 5 mosquitto_sub -h localhost -t test -C 1 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MQTT broker is accessible" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MQTT broker test inconclusive (may be working)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  MQTT broker test inconclusive (may be working)" -ForegroundColor Yellow
}
Write-Host ""

# Check backend health endpoint
Write-Host "7. Testing backend health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend health check passed" -ForegroundColor Green
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
    }
} catch {
    Write-Host "❌ Backend health check failed" -ForegroundColor Red
}
Write-Host ""

# Check frontend
Write-Host "8. Testing frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend check failed" -ForegroundColor Red
}
Write-Host ""

# Network connectivity test
Write-Host "9. Testing inter-service connectivity..." -ForegroundColor Yellow
try {
    docker-compose exec -T backend sh -c "ping -c 1 mongo" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend can reach MongoDB" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend cannot reach MongoDB" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend cannot reach MongoDB" -ForegroundColor Red
}

try {
    docker-compose exec -T backend sh -c "ping -c 1 mqtt" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend can reach MQTT broker" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend cannot reach MQTT broker" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend cannot reach MQTT broker" -ForegroundColor Red
}
Write-Host ""

# Port check
Write-Host "10. Checking port availability..." -ForegroundColor Yellow
$ports = @(
    @{Port=3000; Name="Frontend"},
    @{Port=4000; Name="Backend"},
    @{Port=27017; Name="MongoDB"},
    @{Port=1883; Name="MQTT TCP"},
    @{Port=9001; Name="MQTT WebSocket"}
)

foreach ($portInfo in $ports) {
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $portInfo.Port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Host "✅ $($portInfo.Name) (port $($portInfo.Port)) is listening" -ForegroundColor Green
        } else {
            Write-Host "❌ $($portInfo.Name) (port $($portInfo.Port)) is not accessible" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $($portInfo.Name) (port $($portInfo.Port)) is not accessible" -ForegroundColor Red
    }
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Health Check Complete" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "  Frontend:     http://localhost:3000"
Write-Host "  Backend API:  http://localhost:4000/graphql"
Write-Host "  Health Check: http://localhost:4000/health"
Write-Host "  MongoDB:      mongodb://localhost:27017"
Write-Host "  MQTT TCP:     mqtt://localhost:1883"
Write-Host "  MQTT WS:      ws://localhost:9001"
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f        # View all logs"
Write-Host "  docker-compose ps             # Check status"
Write-Host "  docker-compose restart        # Restart all"
Write-Host "  docker-compose down           # Stop all"
Write-Host ""
