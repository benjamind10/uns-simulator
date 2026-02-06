# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UNS Simulator is a web-based MQTT simulation platform for testing Unified Namespace (UNS) architectures. Users create brokers, define schemas (namespace hierarchies), build simulation profiles, and run MQTT simulations that publish data to those brokers.

## Commands

### Linting (from repo root)
```bash
npm run lint                    # ESLint across client & server (--max-warnings=0)
npm run lint:fix                # ESLint with auto-fix
```

### Server (from server/)
```bash
npm run dev                     # Dev server with hot-reload (ts-node-dev)
npm run build                   # TypeScript compile to dist/
npm start                       # Run compiled dist/index.js
```

### Client (from client/)
```bash
npm run dev                     # Vite dev server (port 5173)
npm run build                   # TypeScript check + Vite production build
npm run preview                 # Preview production build locally
```

### Docker (full stack)
```bash
docker compose up --build       # Starts MongoDB, Mosquitto, Backend (4000), Frontend (3000)
docker compose down             # Stop all services
```

### Testing
```bash
# Client tests (from client/)
npm test                        # Run all tests once (vitest run)
npm run test:watch              # Watch mode (vitest)

# Server has no test framework configured yet.
```

## Architecture

### Monorepo Structure
- **`server/`** — Node.js + Express + Apollo Server 3 (GraphQL) + Mongoose (MongoDB)
- **`client/`** — React 19 + Vite + Redux Toolkit + TailwindCSS 4 + @dnd-kit (drag-and-drop)
- **`mqtt-broker/`** — Mosquitto configuration for local Docker broker

### Backend (server/src/)

**Entry point:** `index.ts` — Express app with Helmet, CORS, rate limiting, Apollo Server middleware, MongoDB connection, and graceful shutdown (SIGTERM/SIGINT stops all simulations).

**GraphQL layer** — Schema-first with merged type definitions and resolvers:
- `graphql/schemas/` — GraphQL SDL type definitions (user, broker, schema, simulationProfile)
- `graphql/resolvers/` — Resolvers with JWT-based auth context (`context.user`)
- `graphql/models/` — Mongoose models: `User`, `Broker`, `Schema`, `SimulationProfile`

**Simulation engine** — The core domain logic:
- `simulation/SimulationEngine.ts` — EventEmitter-based engine that manages MQTT connections, publishes data per schema node at configured frequencies, handles reconnection with exponential backoff. Supports three value generation modes: **static** (fixed value), **random** (range with precision), **increment** (stepped sequence with wrap). Payload generation respects per-node settings with fallback to global defaults.
- `simulation/SimulationManager.ts` — Singleton that orchestrates multiple concurrent SimulationEngine instances (keyed by profile ID)

**Key patterns:**
- Auth is JWT Bearer token verified in `getContext()`, injecting `user` into GraphQL context
- All resources (brokers, schemas, profiles) are scoped to the authenticated user
- On server startup, orphaned simulations (left running from a previous crash) are reset to "stopped"
- SimulationProfile tracks detailed state: idle/starting/running/paused/stopping/stopped/error
- Payload configuration uses a 3-tier merge: `nodeSettings.payload` overrides `globalSettings.defaultPayload` which overrides engine defaults. This ensures backwards compatibility (existing profiles without payload config use default random generation)

### Frontend (client/src/)

**Entry point:** `main.tsx` → `App.tsx` (BrowserRouter with three layout tiers)

**Routing layouts:**
- `PublicLayout` — Landing, Login, Register (unauthenticated)
- `DashboardLayout` — Brokers, Schemas, Simulators pages (authenticated list views)
- `PrivateLayout` — MQTT Explorer, Schema Builder, Simulation page (authenticated detail views)

**State management** — Redux Toolkit store with slices:
- `auth` — JWT token in sessionStorage, login/register thunks
- `brokers` — CRUD operations via GraphQL
- `schema` — Schema CRUD
- `simulationProfile` — Profile CRUD + simulation control (start/stop/pause)
- `mqtt` — Client-side MQTT WebSocket connections (non-serializable state excluded from checks)

**API layer:** `api/` directory contains GraphQL queries/mutations using `graphql-request`, organized by domain (auth, brokers, schema, simulationProfile).

**MQTT client-side:** `utils/mqttConnection.ts` and `mqttConnectionManager.ts` manage browser-side WebSocket MQTT connections for the MQTT Explorer feature (separate from server-side simulation MQTT).

**Schema Builder UI** — 2-panel layout with drag-and-drop:
- `SchemaManager.tsx` — Compact toolbar for schema CRUD (dropdown selector, inline create, delete with confirm)
- `SchemaNodeEditor.tsx` — Left panel: unified tree (saved + temp nodes merged) with DnD via @dnd-kit; Right panel: node builder form with path preview and parent breadcrumb
- `TreeNode.tsx` — Recursive tree node with folder/metric icons, expand/collapse, inline rename (double-click), drag handles, data type badges, hover-visible delete
- `utils/tree.ts` — `buildTree()`, `collectAllIds()`, `recomputePaths()` helpers for tree operations

**Simulator UI** — Per-node and global payload configuration:
- `SimulatorCardContent.tsx` — Main simulation control panel with tabs (Overview, Node Settings, Global Settings)
- `SimulatorNodeSettings.tsx` — Per-node frequency/failRate settings with collapsible payload editor for each metric
- `SimulatorGlobalForm.tsx` — Global simulation settings including default payload template (inherited by all nodes unless overridden)
- `NodePayloadEditor.tsx` — Comprehensive payload configuration form with quality, timestamp mode, value generation (static/random/increment), custom fields, live preview, and inline validation

### Data Flow for Simulations
1. User creates a **Broker** (MQTT connection details)
2. User creates a **Schema** (tree of namespace nodes: groups, metrics, objects)
3. User creates a **SimulationProfile** linking a schema + broker with:
   - **Global settings**: publishRoot, default payload template (quality, timestamp mode, value generation, custom fields)
   - **Per-node settings**: frequency, failRate, payload overrides (merge priority: per-node > global defaults > hardcoded defaults)
4. User starts simulation → server-side `SimulationEngine` connects to the MQTT broker and publishes data on configured topics at configured intervals

### Payload Configuration System

Each node can publish fully customizable JSON payloads with the following structure:
```json
{
  "quality": "good",           // Configurable: good, bad, uncertain, etc.
  "timestamp": 1738857600000,  // Auto (Date.now()) or Fixed
  "value": 42.5,               // Generated via static/random/increment mode
  "custom_field": "value"      // User-defined custom fields
}
```

**Value Generation Modes:**
- **Static**: Returns exact configured value (supports Int, Float, Bool, String)
- **Random**: Generates random values within minValue/maxValue range with optional precision (for Float)
- **Increment**: Steps through values using a configured step size, wraps at maxValue

**Payload Merge Priority:** Per-node payload config > Global default payload > Engine defaults

**Testing:** Users can send single test messages via `testPublishNode` mutation (GraphQL) without starting a full simulation

## Code Style

- TypeScript strict mode on both client and server
- Prettier: single quotes, semicolons, 2-space indent, 80-char width, trailing commas (ES5)
- ESLint: zero-warning policy, import ordering with newlines between groups, unused vars prefixed with `_`
- Server: CommonJS modules (ES2020 target)
- Client: ESNext modules (ES2022 target, bundler resolution)
- Client test config is in `client/vitest.config.ts` (separate from `vite.config.ts` to avoid type conflicts)
- Test files in `client/src/__tests__/` are excluded from `tsconfig.app.json` to prevent Docker build failures

## Environment Variables

Copy `.env.example` to `.env`. Key variables:
- `MONGO_URI` / `DB_NAME` — MongoDB connection
- `JWT_SECRET` — Token signing key
- `CLIENT_URL` — Allowed CORS origin
- `VITE_API_URL` — GraphQL endpoint URL (build-time for client)
- `MQTT_HOST` / `MQTT_PORT` / `MQTT_WS_PORT` — Broker connection (Docker service name `mqtt` in compose)
- `ENABLE_RATE_LIMIT` — Set to `"true"` to enable express-rate-limit

## Docker Services

| Service | Port | Image |
|---------|------|-------|
| MongoDB | 27017 | mongo:6 |
| Mosquitto MQTT | 1883 (MQTT), 9001 (WebSocket) | eclipse-mosquitto:2 |
| Backend | 4000 | Custom (Node 20 Alpine) |
| Frontend | 3000 | Custom (Nginx) |

All services have health checks. Backend depends on healthy MongoDB + MQTT; Frontend depends on healthy Backend.
