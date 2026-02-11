# UNS Simulator

A **free, open source**, production-ready, web-based MQTT simulation platform for testing Unified Namespace (UNS) architectures, development, and educational purposes. Built with enterprise-grade reliability, security, and performance.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-47A248.svg)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg)](https://vite.dev/)

> **Recent Updates (Feb 2025):** Custom payload configuration, UI redesign with unified app shell, and major stability enhancements. See [CHANGELOG.md](CHANGELOG.md) for details.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Capabilities

- **🔐 Secure Authentication & Authorization**
  JWT-based authentication with secure session management
- **📡 Advanced MQTT Broker Management**
  - Connect to multiple MQTT brokers simultaneously
  - Real-time connection status monitoring
  - Auto-reconnection with exponential backoff
  - WebSocket (WS/WSS) support
- **🔌 MQTT Backbone System**
  - System-wide MQTT connection for status and control
  - Real-time server health and simulation status publishing
  - MQTT-based command/control interface
  - Centralized logging via MQTT topics
  - Remote monitoring and control capabilities
- **📊 Real-Time Simulation Engine**
  - Configure node-level publish frequencies
  - Simulate data with configurable failure rates
  - Time-scale control for accelerated testing
  - Automatic cleanup and resource management
- **🎛️ Custom Payload Configuration**
  - Three value generation modes: static, random, increment
  - Per-node and global default payload settings
  - Custom fields support (user-defined key/value pairs)
  - Live payload preview and test publish
  - Configurable quality, timestamp mode, and precision
- **🌳 MQTT Topic Explorer**
  - Interactive topic tree visualization
  - Live message viewer with filtering
  - Topic subscription management
  - Message history (up to 1000 messages)
- **📝 Schema Management**
  - Import/export schemas (JSON format)
  - UNS-compliant namespace definitions
  - Node-level configuration and metadata
- **🎮 Simulation Profiles**
  - Multiple simulation profiles per schema
  - Global and per-node settings
  - Simulation lifecycle management (start/stop/pause/resume)
  - Automatic state recovery after server restarts
- **📈 Metrics Dashboard**
  - Real-time broker status
  - Active simulation monitoring
  - Schema and profile statistics
- **🎨 Modern UI/UX**
  - Dark/light theme support
  - Responsive design (mobile-friendly)
  - Floating simulation control widget
  - Toast notifications and error handling

### Recent Enhancements

- ✅ **MQTT Backbone System** - System-wide MQTT connection for real-time status publishing, event streaming, remote control, and centralized logging
- ✅ **Custom Payload Configuration** - Full control over published MQTT payloads with static/random/increment value modes, custom fields, and live preview
- ✅ **UI Redesign** - Unified app shell with collapsible sidebar, redesigned dashboard, broker management with modals, and consistent design system
- ✅ **Reusable UI Components** - Card, Badge, PageHeader, EmptyState, SlideOver, Avatar, Tooltip components
- ✅ **Orphaned Simulation Recovery** - Automatic cleanup on server restart
- ✅ **Graceful Shutdown** - Proper cleanup of all simulations
- ✅ **Memory Leak Fixes** - Both client and server side
- ✅ **Enhanced Security** - No credential exposure in logs/API
- ✅ **Performance Optimizations** - Database indexes, optimized selectors

---

## Architecture

### System Overview

```
┌─────────────────┐      GraphQL/HTTP            ┌─────────────────┐
│                 │◄────────────────────────────►│                 │
│  React Client   │                              │  Node.js API    │
│  (TypeScript)   │                              │  (TypeScript)   │
│                 │                              │                 │
└─────────────────┘                              └────────┬────────┘
         │                                                │
         │ MQTT/WebSocket (uns-client)                   │ MQTT TCP (uns-backend)
         │                                                │
         ▼                                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                     MQTT Broker (Mosquitto)                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  System Topics: uns-simulator/_sys/                        │  │
│  │    • status/server (server health)                         │  │
│  │    • status/simulations/* (simulation status)              │  │
│  │    • logs/simulations/* (simulation logs)                  │  │
│  │    • events/* (lifecycle events)                           │  │
│  │    • cmd/* (remote control commands)                       │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Data Topics: user-defined simulation data                 │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                      ┌─────────────────┐
                      │    MongoDB      │
                      │   (Database)    │
                      └─────────────────┘
```

### Key Components

- **Simulation Engine** - Manages simulation lifecycle and MQTT publishing
- **Simulation Manager** - Orchestrates multiple concurrent simulations
- **MQTT Backbone** - System-wide MQTT connection for status, events, and control
- **GraphQL API** - Type-safe API layer with Apollo Server
- **Redux Store** - Centralized state management on client
- **MQTT Client Manager** - Handles WebSocket connections to brokers

---

## Tech Stack

### Frontend

- **React 19** with TypeScript for type safety
- **Redux Toolkit** for predictable state management
- **GraphQL Client** (graphql-request) for API communication
- **TailwindCSS 4** for modern, responsive styling
- **React Router 7** for client-side routing
- **MQTT.js** for WebSocket MQTT connections
- **Vite 6** for fast development and builds
- **@dnd-kit** for drag-and-drop (schema builder)
- **Lucide React** for icons
- **@headlessui/react** for accessible UI primitives

### Backend

- **Node.js** with TypeScript
- **Apollo Server** for GraphQL API
- **MongoDB** with Mongoose ODM
- **MQTT.js** for broker connections
- **JWT** for stateless authentication
- **Express** middleware (Helmet, CORS, compression)
- **bcrypt** for password hashing

### DevOps

- **Docker** & **Docker Compose** for containerization
- **ESLint** & **Prettier** for code quality
- **TypeScript** strict mode for compile-time safety

---

## Getting Started

### Prerequisites

- **Node.js** v20 or higher
- **MongoDB** v6 or higher (running locally or cloud instance)
- **npm** package manager
- **MQTT Broker** (optional, e.g., Mosquitto for local testing)
- **Docker** (optional, for containerized deployment)

### Quick Start with Docker Compose (Recommended)

The fastest way to get started with all services running:

```bash
# Clone the repository
git clone https://github.com/benjamind10/uns-simulator.git
cd uns-simulator

# Create environment file from example
cp .env.example .env

# Edit .env and set your JWT_SECRET (required!)
# On Linux/Mac: nano .env
# On Windows: notepad .env

# For localhost access (default values):
# Just use the defaults from .env.example

# For network access (e.g., from other machines):
# Update FRONTEND_PUBLIC_URL, VITE_API_URL, and VITE_MQTT_SERVER_URL
# to match your Docker host IP or domain

# Start all services (MongoDB, MQTT broker, backend, frontend)
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f

# Access the application
# Frontend: http://localhost:9071
# Backend: http://localhost:4000/graphql (via nginx reverse proxy)
# Backend Health: http://localhost:4000/health
```

**What's Included:**

- MongoDB database (port 27017)
- Eclipse Mosquitto MQTT broker (TCP: 1883, WebSocket: 9001)
- Node.js backend API (port 4000)
- React frontend (port 9071 via Nginx)

**📖 For complete Docker documentation, troubleshooting, and production deployment, see:**
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Full deployment guide with environment variable reference
- **[DOCKER.md](DOCKER.md)** - Docker-specific documentation and troubleshooting

**Common Docker Commands:**

```bash
# Stop all services
docker-compose down

# Restart services
docker-compose restart

# View service logs
docker-compose logs -f [service-name]  # backend, frontend, mongo, mqtt

# Rebuild after code changes
docker-compose up -d --build
```

**Quick Troubleshooting:**

- **Port already in use:** Stop local Node.js servers first
- **Services won't start:** Check `docker-compose logs [service-name]`
- **Can't connect to backend:** Wait for health checks to pass (`docker-compose ps`)
- **More help:** Run `.\docker-health-check.ps1` or see [DOCKER.md](DOCKER.md)

### Manual Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/benjamind10/uns-simulator.git
cd uns-simulator
```

#### 2. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

#### 3. Configure Environment Variables

Create `.env` files in both directories:

**Server** (`server/.env`):

```env
# Database
MONGO_URI=mongodb://localhost:27017
DB_NAME=uns_simulator

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=4000
NODE_ENV=development

# MQTT Broker
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_WS_PORT=9001

# MQTT Backbone Credentials
MQTT_BACKBONE_USERNAME=uns-backend
MQTT_BACKBONE_PASSWORD=uns-backend-dev
MQTT_SIM_USERNAME=uns-sim
MQTT_SIM_PASSWORD=uns-sim-dev
MQTT_CLIENT_USERNAME=uns-client
MQTT_CLIENT_PASSWORD=uns-client-dev

# CORS & Security
CLIENT_URL=http://localhost:5173
ENABLE_RATE_LIMIT=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

**Client** (`client/.env`):

```env
# API Configuration
VITE_API_URL=http://localhost:4000/graphql
```

#### 4. Start MongoDB

```bash
# Using MongoDB installed locally
mongod --dbpath /path/to/data

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:6
```

#### 5. Start MQTT Broker (Optional)

```bash
# Using Docker (recommended)
docker run -d -p 1883:1883 -p 9001:9001 \
  -v $(pwd)/mqtt-broker/mosquitto.conf:/mosquitto/config/mosquitto.conf \
  --name mqtt eclipse-mosquitto:2

# Or install Mosquitto locally and configure for WebSocket support
```

#### 6. Start Development Servers

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

#### 7. Access the Application

- **Frontend**: http://localhost:5173
- **GraphQL Playground**: http://localhost:4000/graphql
- **Health Check**: http://localhost:4000/health

### First-Time Setup

1. **Register a user account** at http://localhost:5173/register
2. **Add an MQTT broker** (use a local Mosquitto instance or cloud broker)
3. **Import or create a schema** for your simulation
4. **Create a simulation profile** and configure node settings
5. **Start your first simulation!**

---

## Configuration

### Server Configuration

All server configuration is centralized in `server/src/config/constants.ts`:

```typescript
export const MQTT_CONFIG = {
  CONNECT_TIMEOUT: 15000, // 15 seconds
  RECONNECT_PERIOD: 0, // Manual control
  KEEPALIVE: 30, // 30 seconds
  MAX_RECONNECT_ATTEMPTS: 3, // Before failure
  RECONNECT_BACKOFF_BASE: 2000, // 2 seconds base delay
};

export const SIMULATION_CONFIG = {
  DEFAULT_UPDATE_FREQUENCY: 60, // 60 Hz
  DEFAULT_TIME_SCALE: 1.0, // Real-time
};

export const AUTH_CONFIG = {
  TOKEN_EXPIRATION: '1d', // 24 hours
  BCRYPT_SALT_ROUNDS: 10, // Password hashing
};

export const MQTT_BACKBONE_CONFIG = {
  CLIENT_ID: 'uns-backend-system',
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  CONNECT_TIMEOUT: 10000, // 10 seconds
  RECONNECT_PERIOD: 5000, // Auto-reconnect
  KEEPALIVE: 30,
  QOS_STATUS: 1, // At-least-once for status
  QOS_EVENTS: 0, // At-most-once for events
};
```

### MQTT Backbone Configuration

The MQTT backbone requires credentials configured in your `.env` file:

```env
# MQTT Backbone Credentials
MQTT_BACKBONE_USERNAME=uns-backend
MQTT_BACKBONE_PASSWORD=your-secure-password-change-in-production
MQTT_SIM_USERNAME=uns-sim
MQTT_SIM_PASSWORD=your-secure-password-change-in-production
MQTT_CLIENT_USERNAME=uns-client
MQTT_CLIENT_PASSWORD=your-secure-password-change-in-production
```

**Security Notes:**
- Change default passwords in production
- These credentials are used for ACL-protected MQTT topics
- Each user has specific read/write permissions
- `uns-backend` has full system access
- `uns-client` can read status and issue commands
- `uns-sim` can only write to data topics

### Database Indexes

Optimized indexes for performance:

- `SimulationProfile`: `(userId, status.state)`, `(userId, schemaId)`
- `User`: `(username)`, `(email)`
- `Broker`: `(users)`

---

## Usage

### Managing Brokers

1. Navigate to **Dashboard > Brokers**
2. Click **"Add Broker"** and provide:
   - Broker name
   - URL (without protocol)
   - Port (typically 9001 for WebSocket)
   - Client ID (auto-generated or custom)
   - Credentials (optional)
3. Monitor connection status in real-time
4. Edit or delete brokers as needed

### Creating Schemas

**Option 1: Import from File**

1. Go to **Dashboard > Schemas**
2. Click **"Import Schema"**
3. Upload a JSON file with UNS node structure

**Option 2: Manual Creation**

1. Click **"Create Schema"**
2. Define nodes with paths, types, and metadata
3. Save for reuse across profiles

**Example Schema Structure:**

```json
{
  "name": "Factory Floor",
  "description": "Manufacturing line sensors",
  "nodes": [
    {
      "id": "temp_sensor_1",
      "path": "Factory/Line1/Temperature",
      "kind": "metric",
      "dataType": "Float"
    }
  ]
}
```

### Running Simulations

1. **Create Profile**: Link a schema and broker
2. **Configure Settings**:
   - Global: Default frequency, time scale, publish root, default payload template
   - Per-Node: Override frequency, failure rate, payload (value mode, quality, custom fields)
3. **Control Simulation**:
   - **Start**: Begin publishing data
   - **Pause**: Temporarily halt without disconnecting
   - **Resume**: Continue from paused state
   - **Stop**: End simulation and disconnect

### MQTT Explorer

1. Select a broker from the dropdown
2. View live topic tree as messages arrive
3. Click topics to filter message view
4. Monitor message payload in real-time

### MQTT Backbone & Monitoring

The UNS Simulator includes a built-in MQTT backbone that publishes system status, simulation state, and logs to dedicated MQTT topics. This enables real-time monitoring and remote control.

#### System Topics

All system topics are under `uns-simulator/_sys/`:

**Status Topics (Retained):**
- `status/server` - Server health, uptime, database state (published every 30s)
- `status/simulations/_index` - List of all active simulations
- `status/simulations/{profileId}` - Real-time status for each simulation

**Log Topics (Non-Retained):**
- `logs/simulations/{profileId}` - Live stream of simulation logs

**Event Topics (Non-Retained):**
- `events/system` - Server lifecycle events (startup, shutdown)
- `events/simulation` - Simulation lifecycle events (started, stopped, paused, resumed)

**Command Topics:**
- `cmd/simulation/start` - Start a simulation remotely
- `cmd/simulation/stop` - Stop a simulation remotely
- `cmd/simulation/pause` - Pause a simulation remotely
- `cmd/simulation/resume` - Resume a simulation remotely

#### Monitoring with MQTT Client

You can monitor the system in real-time using any MQTT client (e.g., MQTT Explorer, mosquitto_sub):

**View server status:**
```bash
mosquitto_sub -h localhost -t "uns-simulator/_sys/status/server" -v
```

**Monitor all active simulations:**
```bash
mosquitto_sub -h localhost -t "uns-simulator/_sys/status/simulations/#" -v
```

**Watch simulation logs:**
```bash
mosquitto_sub -h localhost -t "uns-simulator/_sys/logs/simulations/+" -v
```

**Monitor all system events:**
```bash
mosquitto_sub -h localhost -t "uns-simulator/_sys/events/#" -v
```

#### Remote Control via MQTT

You can control simulations remotely by publishing commands to the command topics:

**Start a simulation:**
```bash
mosquitto_pub -h localhost \
  -u uns-client -P uns-client-dev \
  -t "uns-simulator/_sys/cmd/simulation/start" \
  -m '{"profileId":"your-profile-id","correlationId":"cmd-001","origin":"external"}'
```

**Stop a simulation:**
```bash
mosquitto_pub -h localhost \
  -u uns-client -P uns-client-dev \
  -t "uns-simulator/_sys/cmd/simulation/stop" \
  -m '{"profileId":"your-profile-id","correlationId":"cmd-002","origin":"external"}'
```

**Note:** Command topics require authentication with the `uns-client` user. Responses are published to `cmd-response/{correlationId}`.

#### MQTT User Roles

The system uses three MQTT users with different permissions:

- **uns-backend** - System backend (full access to _sys/ topics)
- **uns-sim** - Simulation engines (write to data topics only)
- **uns-client** - Client applications (read status, write commands)

Configure credentials in `.env`:
```env
MQTT_BACKBONE_USERNAME=uns-backend
MQTT_BACKBONE_PASSWORD=your-secure-password
MQTT_SIM_USERNAME=uns-sim
MQTT_SIM_PASSWORD=your-secure-password
MQTT_CLIENT_USERNAME=uns-client
MQTT_CLIENT_PASSWORD=your-secure-password
```

---

## Project Structure

```
uns-simulator/
├── client/                          # Frontend React application
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── api/                     # GraphQL API client
│   │   │   ├── mutations/           # GraphQL mutations
│   │   │   └── queries/             # GraphQL queries
│   │   ├── components/              # React components
│   │   │   ├── Brokers/             # Broker management (cards, modals)
│   │   │   ├── dashboard/           # Dashboard widgets (StatCard)
│   │   │   ├── global/              # Shared components (Navbar, etc.)
│   │   │   ├── schema/              # Schema builder (tree, node editor)
│   │   │   ├── simulator/           # Simulation controls & payload editor
│   │   │   └── ui/                  # Reusable UI primitives
│   │   │       ├── Avatar.tsx
│   │   │       ├── Badge.tsx
│   │   │       ├── Card.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       ├── PageHeader.tsx
│   │   │       ├── SlideOver.tsx
│   │   │       └── Tooltip.tsx
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── layout/                  # Page layouts
│   │   │   ├── AppShell.tsx         # Unified authenticated layout
│   │   │   └── PublicLayout.tsx     # Unauthenticated layout
│   │   ├── pages/                   # Route pages
│   │   │   ├── app/                 # App pages (Home, Brokers)
│   │   │   ├── auth/                # Register
│   │   │   ├── private/             # Tool pages (Simulator, Schema, Explorer)
│   │   │   └── public/              # Landing, Login
│   │   ├── store/                   # Redux Toolkit store
│   │   │   ├── auth/                # Auth state
│   │   │   ├── brokers/             # Broker state
│   │   │   ├── mqtt/                # MQTT connection state
│   │   │   ├── schema/              # Schema state
│   │   │   └── simulationProfile/   # Simulation state
│   │   ├── types/                   # TypeScript definitions
│   │   └── utils/                   # Utility functions
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── server/                          # Backend Node.js application
│   ├── src/
│   │   ├── config/                  # Configuration
│   │   │   ├── constants.ts         # App constants
│   │   │   └── production.ts        # Production config
│   │   ├── graphql/
│   │   │   ├── models/              # Mongoose models
│   │   │   │   ├── Broker.ts
│   │   │   │   ├── Schema.ts
│   │   │   │   ├── SimulationProfile.ts
│   │   │   │   └── User.ts
│   │   │   ├── resolvers/           # GraphQL resolvers
│   │   │   └── schemas/             # GraphQL type definitions
│   │   ├── simulation/              # Simulation engine
│   │   │   ├── SimulationEngine.ts  # Core engine (value generation, MQTT publish)
│   │   │   └── SimulationManager.ts # Multi-sim orchestration (singleton)
│   │   ├── scripts/                 # Utility scripts
│   │   ├── utils/                   # Helper functions
│   │   └── index.ts                 # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── mqtt-broker/                     # Local Mosquitto config
│   └── mosquitto.conf
│
├── ARCHITECTURE.md                  # Technical architecture reference
├── CHANGELOG.md                     # Recent changes
├── CLAUDE.md                        # AI assistant guidance
├── DOCKER.md                        # Docker deployment guide
├── FUTURE_ENHANCEMENTS.md           # Roadmap & future plans
├── docker-compose.yml               # Docker orchestration
└── README.md                        # This file
```

---

## API Documentation

### GraphQL Schema

The API is fully typed and self-documenting. Access the GraphQL Playground at `http://localhost:4000/graphql` to:

- Explore the schema
- Test queries and mutations
- View documentation

### Key Queries

```graphql
# Get all brokers
query {
  brokers {
    id
    name
    url
    port
    status
  }
}

# Get simulation profiles
query {
  simulationProfiles {
    id
    name
    status {
      state
      isRunning
    }
  }
}
```

### Key Mutations

```graphql
# Start simulation
mutation {
  startSimulation(profileId: "abc123")
}

# Stop simulation
mutation {
  stopSimulation(profileId: "abc123")
}
```

---

## Security

### Authentication

- JWT tokens with configurable expiration
- Secure password hashing with bcrypt (10 rounds)
- Session-based token storage (sessionStorage)

### Authorization

- User-scoped resources (brokers, schemas, profiles)
- GraphQL context-based auth checks
- No credential exposure in logs or API responses

### Best Practices

- ✅ Passwords never returned in API responses
- ✅ JWT tokens not logged
- ✅ CORS configured for known origins
- ✅ Rate limiting available (configurable)
- ✅ Helmet.js security headers
- ✅ Input validation on all mutations

### Production Recommendations

1. Use **httpOnly cookies** instead of sessionStorage for tokens
2. Enable **HTTPS/WSS** for all connections
3. Implement **Content Security Policy**
4. Add **request timeouts**
5. Enable **rate limiting**
6. Use **environment-specific secrets**

---

## Performance

### Optimizations

- **Database Indexes**: Compound indexes on frequent queries
- **Connection Pooling**: MongoDB connection reuse
- **Message Limiting**: Max 1000 MQTT messages in memory
- **Selector Memoization**: Redux reselect for expensive computations
- **Lazy Loading**: Code-split routes (configurable)

### Monitoring

- Real-time simulation status tracking
- Broker connection health monitoring
- Graceful degradation on errors

### Scalability

- Horizontal scaling supported with sticky sessions
- Stateless authentication
- Event-driven architecture for simulations

---

## Troubleshooting

### Common Issues

#### MongoDB Connection Failed

```
Error: Failed to connect to MongoDB
```

**Solution:**

- Verify MongoDB is running: `mongod --version`
- Check connection string in `server/.env`
- Ensure MongoDB is accessible on port 27017

#### MQTT Broker Connection Timeout

```
Error: MQTT connection timeout
```

**Solution:**

- Verify broker URL and port are correct
- Check if broker supports WebSocket (WS/WSS)
- Test broker with MQTT client (e.g., MQTT.fx)
- Check firewall rules

#### Simulation Won't Stop/Pause

```
Simulation appears running but controls disabled
```

**Solution:**

- This was a known bug, now fixed (see CHANGELOG.md)
- Restart the server to trigger automatic cleanup
- If issue persists, delete and recreate the profile

#### "Session Expired" Errors

```
Error: Unauthorized / Session expired
```

**Solution:**

- Token may have expired (24h default)
- Clear browser sessionStorage and log in again
- Check JWT_SECRET matches between sessions

#### High Memory Usage

```
Application consuming excessive memory
```

**Solution:**

- Check MQTT message accumulation (limited to 1000)
- Monitor number of concurrent simulations
- Review node publishing frequencies
- Restart application to clear state

### Debug Mode

Enable detailed logging:

```env
# server/.env
NODE_ENV=development
DEBUG=*
```

### Logs Location

- **Server logs**: Console output (stdout/stderr)
- **Client logs**: Browser DevTools Console
- **MongoDB logs**: Check MongoDB log file location

### Getting Help

1. Check [CHANGELOG.md](CHANGELOG.md) for recent fixes
2. Review [Issues](https://github.com/benjamind10/uns-simulator/issues) on GitHub
3. Create a new issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node version, OS, etc.)
   - Relevant logs

---

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**

   ```bash
   git clone https://github.com/<your-username>/uns-simulator.git
   ```

2. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**

   - Follow existing code style
   - Add tests if applicable
   - Update documentation

4. **Test your changes**

   ```bash
   # Run server tests
   cd server && npm test

   # Run client tests
   cd client && npm test
   ```

5. **Commit with clear messages**

   ```bash
   git commit -m "feat: add amazing feature"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):

   - `feat:` New features
   - `fix:` Bug fixes
   - `docs:` Documentation changes
   - `refactor:` Code refactoring
   - `test:` Test additions/changes
   - `chore:` Maintenance tasks

6. **Push and create Pull Request**
   ```bash
   git push origin feature/amazing-feature
   ```

### Code Standards

- **TypeScript**: Use strict mode, avoid `any`
- **Formatting**: Prettier with consistent config
- **Linting**: ESLint rules enforced
- **Testing**: Write tests for new features
- **Documentation**: Update README and inline comments

### Pull Request Guidelines

- Provide clear description of changes
- Reference related issues
- Include screenshots for UI changes
- Ensure all tests pass
- Keep PRs focused and atomic

---

## License

This project is **free and open source** software licensed under the **MIT License**. You are free to use, modify, and distribute this software for any purpose, including commercial applications.

```
MIT License

Copyright (c) 2025 UNS Simulator Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

See the license text above for details.

---

## Acknowledgements

### Technologies

- [Node.js](https://nodejs.org/) - JavaScript runtime
- [React](https://reactjs.org/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Apollo GraphQL](https://www.apollographql.com/) - API layer
- [MongoDB](https://www.mongodb.com/) - Database
- [MQTT.js](https://github.com/mqttjs/MQTT.js) - MQTT client
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Redux Toolkit](https://redux-toolkit.js.org/) - State management

### Inspiration

- [Unified Namespace (UNS) Architecture](https://www.hivemq.com/blog/unified-namespace-uns-essentials-iiot-industry-40/)
- [ISA-95 Standard](https://www.isa.org/standards-and-publications/isa-standards/isa-standards-committees/isa95)
- [MQTT Protocol](https://mqtt.org/)

### Tools

- [Mosquitto](https://mosquitto.org/) - MQTT broker for testing
- [MongoDB Compass](https://www.mongodb.com/products/compass) - Database GUI
- [Postman](https://www.postman.com/) - API testing

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed information about recent updates, bug fixes, and enhancements.

**Latest Updates:**

- ✅ Custom payload configuration with static/random/increment value modes
- ✅ UI redesign with unified app shell and design system
- ✅ Enhanced security and error handling
- ✅ Performance optimizations and memory leak fixes

---

## Support

- **Documentation**: This README, [ARCHITECTURE.md](ARCHITECTURE.md), and [DOCKER.md](DOCKER.md)
- **Issues**: [GitHub Issues](https://github.com/benjamind10/uns-simulator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/benjamind10/uns-simulator/discussions)

---

**Built with ❤️ for the IIoT and Industry 4.0 community**
