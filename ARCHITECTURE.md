# Architecture Reference

Technical architecture reference for developers working on the UNS Simulator codebase.

---

## System Overview

```
┌─────────────────────┐    GraphQL (HTTP)     ┌─────────────────────┐
│                     │◄─────────────────────►│                     │
│    React Client     │                       │   Node.js Server    │
│    (Vite + Redux)   │                       │ (Express + Apollo)  │
│                     │                       │                     │
└────────┬────────────┘                       └───┬─────────┬───────┘
         │                                        │         │
         │ MQTT/WebSocket                    MQTT │    Mongoose
         │ (browser-side,                         │         │
         │  Explorer only)                        │         │
         ▼                                        ▼         ▼
┌─────────────────────┐                       ┌──────────────────┐
│    MQTT Broker      │                       │     MongoDB      │
│   (Mosquitto)       │                       │                  │
└─────────────────────┘                       └──────────────────┘
```

The client talks to the server via GraphQL. The server connects to MQTT brokers to run simulations (publishing data). The client also connects to MQTT brokers directly via WebSocket for the MQTT Explorer feature (subscribing/viewing messages).

---

## Backend Architecture

### Entry Point (`server/src/index.ts`)

Express app with the following middleware stack:
1. **Helmet** — Security headers (CSP disabled in dev)
2. **Compression** — gzip responses
3. **Rate Limiting** — Configurable via `ENABLE_RATE_LIMIT` env var
4. **CORS** — Whitelist of allowed origins
5. **Health Check** — `GET /health` endpoint checking MongoDB state
6. **Metrics** — `GET /metrics` endpoint (Prometheus format via prom-client)
7. **Apollo Server** — GraphQL middleware with auth context

**Startup sequence:**
1. Connect to MongoDB
2. Clean up orphaned simulations (any profiles left in running/paused state from a previous crash are reset to stopped)
3. Start Apollo Server and apply middleware
4. Listen on configured port

**Graceful shutdown:** SIGTERM/SIGINT handlers stop all running simulations via `SimulationManager`, close MongoDB, then exit.

### GraphQL Layer

Schema-first approach with merged type definitions and resolvers:

- `graphql/schemas/` — SDL type definitions (user, broker, schema, simulationProfile)
- `graphql/resolvers/` — Resolver functions with auth context
- `graphql/models/` — Mongoose models: `User`, `Broker`, `Schema`, `SimulationProfile`

### Authentication

JWT-based auth flow:

1. **Login/Register** — Resolver generates JWT: `jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1d' })`
2. **Context injection** — `getContext()` extracts `Authorization: Bearer <token>`, verifies with `jwt.verify()`, loads user from DB, injects into `context.user`
3. **Authorization** — Resolvers call `requireAuth(ctx)` which throws `'Unauthenticated'` if no user in context
4. **Resource scoping** — All queries filter by `userId` to ensure users only see their own data

Passwords are hashed with bcrypt (10 salt rounds) via a Mongoose pre-save middleware on the User model.

### Simulation Engine (`server/src/simulation/SimulationEngine.ts`)

EventEmitter-based engine that manages one simulation's lifecycle:

**Key methods:**
| Method | Purpose |
|--------|---------|
| `initializeNodes()` | Filters schema for metric nodes, merges payload settings |
| `connectToBroker()` | Creates MQTT client, handles auth, reconnection with exponential backoff |
| `start()` | Connects to broker, starts publishing intervals for each node |
| `stop()` | Clears all intervals, disconnects MQTT, updates DB status |
| `pause()` / `resume()` | Clears/restarts intervals without closing MQTT connection |
| `publishNodeData()` | Applies failRate, generates payload, publishes to topic |
| `generateNodeValue()` | Implements value generation based on configured mode |

**Value generation modes:**

| Mode | Behavior |
|------|----------|
| **static** | Returns exact configured value (supports Int, Float, Bool, String) |
| **random** | Random value within `[minValue, maxValue]`, optional precision for Float |
| **increment** | Steps by `step` each tick, wraps at `maxValue` back to start value |

**Payload merge priority** (3-tier):
```
per-node nodeSettings.payload  >  globalSettings.defaultPayload  >  engine defaults
```

**Reconnection:** Exponential backoff (`RECONNECT_BACKOFF_BASE * attempts`), up to `MAX_RECONNECT_ATTEMPTS`. On max reached, sets profile status to `'error'`.

**Events emitted:** `started`, `stopped`, `paused`, `resumed`, `nodePublished`, `nodeFailure`, `publishError`

### Simulation Manager (`server/src/simulation/SimulationManager.ts`)

Singleton that orchestrates multiple concurrent SimulationEngine instances, keyed by profile ID in a `Map<string, SimulationEngine>`.

- `startSimulation()` — Stops any existing engine for the profile, creates a new one, starts it
- `stopAllSimulations()` — Parallelizes `stop()` calls via `Promise.all()` (used during graceful shutdown)

---

## Frontend Architecture

### Entry Point & Routing (`client/src/App.tsx`)

Three layout tiers:

| Layout | Routes | Purpose |
|--------|--------|---------|
| `PublicLayout` | `/`, `/login`, `/register` | Unauthenticated pages |
| `AppShell` | `/app/*` | Unified authenticated shell (sidebar + top bar) |
| Legacy redirects | `/dashboard/*`, `/simulator/*`, etc. | Redirect old routes to `/app/*` |

**App routes (`/app/*`):**
- `/app` — Home dashboard (stats, quick actions, recent profiles)
- `/app/simulator/:profileId?` — Simulation workspace
- `/app/schemas/:schemaId?` — Schema builder
- `/app/explorer` — MQTT Explorer
- `/app/brokers` — Broker management

### State Management (Redux Toolkit)

Five slices in `client/src/store/`:

| Slice | Key State | Key Thunks |
|-------|-----------|------------|
| `auth` | user, token, isAuthenticated | loginAsync, registerAsync, logoutAsync |
| `brokers` | brokers[], loading | fetchBrokersAsync, createBrokerAsync, updateBrokerAsync, deleteBrokerAsync |
| `schema` | schemas[], selectedSchemaId | fetchSchemasAsync, createSchemaAsync, saveNodesToSchemaAsync |
| `simulationProfile` | profiles (Record), selectedProfileId, simulationStates | start/stop/pause/resumeSimulationAsync, upsertNodeSettingsAsync |
| `mqtt` | connections (Record) | connectToBrokerAsync, disconnectFromBrokerAsync |

The `mqtt` slice stores non-serializable MQTT client instances. The store is configured to ignore serialization checks for `mqtt.connections` and `mqtt/setConnectionStatus`.

JWT tokens are persisted to `sessionStorage` in the auth slice.

### API Layer (`client/src/api/`)

GraphQL queries and mutations using `graphql-request`, organized by domain:
- `api/mutations/` — Write operations (login, createBroker, startSimulation, etc.)
- `api/queries/` — Read operations (brokers, schemas, simulationProfiles, etc.)

### MQTT Client-Side (`client/src/utils/`)

Separate from server-side simulation MQTT. Used for the MQTT Explorer feature:

- **`mqttConnection.ts`** — Low-level wrapper around mqtt.js for browser WebSocket connections
- **`mqttConnectionManager.ts`** — Singleton managing multiple browser MQTT connections per broker. Handles Docker service name → localhost mapping and MQTT port 1883 → WebSocket port 9001 translation

### UI Components

**Reusable primitives** (`client/src/components/ui/`):
Card, Badge, PageHeader, EmptyState, SlideOver, Avatar, Tooltip

**Schema Builder** (`client/src/components/schema/`):
- `SchemaNodeEditor.tsx` — Left panel: tree with DnD via @dnd-kit; Right panel: node builder form
- `TreeNode.tsx` — Recursive tree node with inline rename, drag handles, type badges
- Tree utilities in `client/src/utils/tree.ts`: `buildTree()` (flat → nested), `collectAllIds()`, `recomputePaths()` (recalculates paths after reparenting)

**Simulator** (`client/src/components/simulator/`):
- `SimulatorCardContent.tsx` — Main control panel with tabs (Overview, Node Settings, Global Settings)
- `SimulatorNodeSettings.tsx` — Per-node frequency/failRate with collapsible payload editor
- `SimulatorGlobalForm.tsx` — Global settings including default payload template
- `NodePayloadEditor.tsx` — Full payload configuration form (quality, timestamp, value mode, custom fields, live preview)

---

## Key Data Flows

### Simulation Lifecycle

```
User creates Profile (schema + broker + settings)
  → User clicks Start
    → GraphQL mutation → Resolver calls SimulationManager.startSimulation()
      → SimulationManager creates SimulationEngine
        → Engine connects to MQTT broker
        → Engine starts intervals for each metric node
          → Each interval: generateNodeValue() → publishNodeData() → MQTT publish
  → User clicks Stop
    → Resolver calls SimulationManager.stopSimulation()
      → Engine clears intervals, disconnects MQTT, updates DB
```

### Payload Construction

Each tick per node:
1. Check `failRate` — random skip if triggered
2. Build payload object:
   - `quality` from config (default: `'good'`)
   - `timestamp` from config mode (`auto` = `Date.now()`, `fixed` = configured value)
   - `value` from `generateNodeValue()` (static/random/increment based on config)
   - Custom fields spread into payload
3. Publish JSON to computed MQTT topic (`publishRoot/node.path`)

### Schema Builder Tree Operations

- Flat `ISchemaNode[]` array stored in DB with `parent` references
- `buildTree()` converts flat → nested `TreeNode[]` for rendering
- Drag-and-drop reparenting triggers `recomputePaths()` which walks ancestors to rebuild `path` strings for the moved node and all descendants

---

## Code Conventions

| Area | Convention |
|------|-----------|
| TypeScript | Strict mode on both client and server |
| Formatting | Prettier: single quotes, semicolons, 2-space indent, 80-char width, trailing commas (ES5) |
| Linting | ESLint: zero-warning policy, import ordering with newlines between groups |
| Server modules | CommonJS (ES2020 target) |
| Client modules | ESNext (ES2022 target, bundler resolution) |
| Testing | Client: Vitest (`client/vitest.config.ts`); Server: Jest |
| Test files | `client/src/__tests__/`, `server/src/__tests__/` — excluded from production builds |

---

## Environment & Docker

### Key Environment Variables

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` / `DB_NAME` | MongoDB connection |
| `JWT_SECRET` | Token signing key (required) |
| `CLIENT_URL` | Allowed CORS origin |
| `VITE_API_URL` | GraphQL endpoint URL (build-time) |
| `ENABLE_RATE_LIMIT` | Set `"true"` to enable express-rate-limit |

### Docker Services

| Service | Port | Image | Health Check |
|---------|------|-------|-------------|
| MongoDB | 27017 | mongo:6 | `mongosh --eval "db.adminCommand('ping')"` |
| Mosquitto | 1883 (MQTT), 9001 (WS) | eclipse-mosquitto:2 | `mosquitto_sub -t '$SYS/#' -C 1` |
| Backend | 4000 | Node 20 Alpine | `wget http://localhost:4000/health` |
| Frontend | 3000 | Nginx | HTTP check |

All services run on the `uns-network` bridge network. Backend depends on healthy MongoDB + MQTT; Frontend depends on healthy Backend. See [DOCKER.md](DOCKER.md) for full deployment guide.
