# UNS Simulator

A production-ready, web-based MQTT simulation platform for testing Unified Namespace (UNS) architectures, development, and educational purposes. Built with enterprise-grade reliability, security, and performance.

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-339933.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-47A248.svg)](https://www.mongodb.com/)

> **Recent Updates (Nov 2025):** Major stability and security enhancements. See [CHANGELOG.md](CHANGELOG.md) for details.

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
- **📊 Real-Time Simulation Engine**
  - Configure node-level publish frequencies
  - Simulate data with configurable failure rates
  - Time-scale control for accelerated testing
  - Automatic cleanup and resource management
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

### Recent Enhancements (Nov 2025)

- ✅ **Orphaned Simulation Recovery** - Automatic cleanup on server restart
- ✅ **Graceful Shutdown** - Proper cleanup of all simulations
- ✅ **Memory Leak Fixes** - Both client and server side
- ✅ **Enhanced Security** - No credential exposure in logs/API
- ✅ **Performance Optimizations** - Database indexes, optimized selectors
- ✅ **Improved Error Handling** - Better error messages and recovery

---

## Architecture

### System Overview

```
┌─────────────────┐      GraphQL/WebSocket      ┌─────────────────┐
│                 │◄────────────────────────────►│                 │
│  React Client   │                              │  Node.js API    │
│  (TypeScript)   │                              │  (TypeScript)   │
│                 │                              │                 │
└─────────────────┘                              └────────┬────────┘
         │                                                │
         │ MQTT/WebSocket                                │
         ▼                                                ▼
┌─────────────────┐                              ┌─────────────────┐
│  MQTT Brokers   │                              │    MongoDB      │
│  (Mosquitto)    │                              │   (Database)    │
└─────────────────┘                              └─────────────────┘
```

### Key Components

- **Simulation Engine** - Manages simulation lifecycle and MQTT publishing
- **Simulation Manager** - Orchestrates multiple concurrent simulations
- **GraphQL API** - Type-safe API layer with Apollo Server
- **Redux Store** - Centralized state management on client
- **MQTT Client Manager** - Handles WebSocket connections to brokers

---

## Tech Stack

### Frontend

- **React 18** with TypeScript for type safety
- **Redux Toolkit** for predictable state management
- **GraphQL Client** (graphql-request) for API communication
- **TailwindCSS** for modern, responsive styling
- **React Router** for client-side routing
- **MQTT.js** for WebSocket MQTT connections
- **Vite** for fast development and builds

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

- **Node.js** v16 or higher
- **MongoDB** v6 or higher (running locally or cloud instance)
- **npm** or **yarn** package manager
- **MQTT Broker** (optional, e.g., Mosquitto for local testing)
- **Docker** (optional, for containerized deployment)

### Quick Start with Docker Compose

The fastest way to get started:

```bash
# Clone the repository
git clone https://github.com/benduran-fbin/uns-simulator.git
cd uns-simulator

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:4000/graphql
```

### Manual Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/benduran-fbin/uns-simulator.git
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
DB_NAME=unsdb

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=4000
NODE_ENV=development

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
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### 5. Start Development Servers

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

#### 6. Access the Application

- **Frontend**: http://localhost:5173
- **GraphQL Playground**: http://localhost:4000/graphql

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
```

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
   - Global: Default frequency, time scale, publish root
   - Per-Node: Override frequency, set failure rate, custom payloads
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
│   │   │   ├── brokers/             # Broker management
│   │   │   ├── global/              # Shared components
│   │   │   ├── schema/              # Schema management
│   │   │   └── simulator/           # Simulation controls
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── layout/                  # Page layouts
│   │   ├── pages/                   # Route pages
│   │   │   ├── auth/                # Login/register
│   │   │   ├── dashboard/           # Dashboard views
│   │   │   └── private/             # Protected routes
│   │   ├── store/                   # Redux store
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
│   │   │   ├── SimulationEngine.ts  # Core engine
│   │   │   └── SimulationManager.ts # Multi-sim orchestration
│   │   ├── scripts/                 # Utility scripts
│   │   ├── utils/                   # Helper functions
│   │   └── index.ts                 # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── mqtt-broker/                     # Local Mosquitto config
│   └── mosquitto.conf
│
├── docker-compose.yml               # Docker orchestration
├── CHANGELOG.md                     # Recent changes
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
2. Review [Issues](https://github.com/benduran-fbin/uns-simulator/issues) on GitHub
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
   git clone https://github.com/your-username/uns-simulator.git
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

This project is licensed under the **MIT License**.

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

See the [LICENSE](LICENSE) file for details.

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

**Latest Updates (November 2025):**

- ✅ Fixed critical simulation state bugs after server restart
- ✅ Enhanced security (no credential exposure)
- ✅ Performance optimizations (database indexes, React selectors)
- ✅ Memory leak fixes (both client and server)
- ✅ Graceful shutdown handling

---

## Support

- **Documentation**: This README and inline code comments
- **Issues**: [GitHub Issues](https://github.com/benduran-fbin/uns-simulator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/benduran-fbin/uns-simulator/discussions)

---

**Built with ❤️ for the IIoT and Industry 4.0 community**
