# MQTT Application Backbone - Roadmap

The UNS Simulator uses MQTT as its own communication backbone, publishing application state and accepting commands over well-known system topics. This document tracks the multi-phase implementation.

## Topic Namespace

All system topics live under `uns-simulator/_sys/`, clearly separated from user simulation data.

```
uns-simulator/_sys/
  status/
    server                           # Server health & heartbeat (retained)
    simulations/{profileId}          # Per-simulation status (retained)
    simulations/_index               # Active simulation IDs (retained)
    brokers/{brokerId}               # Broker connectivity (retained)
    brokers/_index                   # All broker IDs (retained)
  data/
    schemas/{schemaId}               # Schema definition snapshot (retained)
    schemas/_index                   # All schema IDs (retained)
    profiles/{profileId}             # Profile config snapshot (retained)
    profiles/_index                  # All profile IDs (retained)
  events/
    system                           # Server lifecycle events (non-retained)
    simulation                       # Simulation lifecycle events (non-retained)
  cmd/
    simulation/start                 # Start simulation command
    simulation/stop                  # Stop simulation command
    simulation/pause                 # Pause simulation command
    simulation/resume                # Resume simulation command
  cmd-response/
    {correlationId}                  # Response to a command (non-retained)
```

## Broker Users & ACL

| User | Purpose | Access |
|------|---------|--------|
| `uns-backend` | Backend system service | readwrite `#` (unrestricted) |
| `uns-client` | External tools, MCP agents | read `_sys/status,data,events`, write `_sys/cmd` |
| `uns-sim` | Simulation engines, MQTT Explorer | readwrite `#` |

Password file generated via `mqtt-broker/generate-passwd.sh`.

---

## Phase 1: Foundation

**Status: Complete**

Broker auth/ACL + backend MqttBackboneService with status publishing.

### What's Included
- Mosquitto `passwd` file with three users, `acl` file with role-based rules
- `server/src/mqtt/topics.ts` - Topic path constants
- `server/src/mqtt/MqttBackboneService.ts` - Singleton backbone service
- Server startup/shutdown integration (system events)
- SimulationManager forwards engine events to backbone (status + events)
- Docker compose volume mounts for ACL/passwd files
- Environment variables for backbone credentials

### Published Topics
- `uns-simulator/_sys/status/server` - Heartbeat every 30s (retained)
- `uns-simulator/_sys/status/simulations/{id}` - On state change (retained)
- `uns-simulator/_sys/status/simulations/_index` - Active list (retained)
- `uns-simulator/_sys/events/system` - Server start/shutdown
- `uns-simulator/_sys/events/simulation` - Started/stopped/paused/resumed/error

### Verification
```bash
# Subscribe to all system topics (needs uns-client credentials)
mosquitto_sub -h localhost -u uns-client -P uns-client-dev \
  -t 'uns-simulator/_sys/#' -v

# Verify anonymous cannot access system topics
mosquitto_sub -h localhost -t 'uns-simulator/_sys/#' -v
# Should be denied
```

---

## Phase 2: Bidirectional Command Control (Current)

**Status: Complete**

External systems can start/stop/pause/resume simulations via MQTT commands.

### New Files
- `server/src/mqtt/commandHandler.ts` - Command dispatch logic

### Changes
- MqttBackboneService subscribes to `uns-simulator/_sys/cmd/#`
- Incoming commands dispatched to SimulationManager
- Optional `correlationId` for request/response pattern
- Command responses published to `uns-simulator/_sys/cmd-response/{correlationId}`

### Command Format
```json
{
  "profileId": "abc123",
  "correlationId": "req-001",
  "timestamp": 1738857600000
}
```

### Response Format
```json
{
  "correlationId": "req-001",
  "success": true,
  "error": null,
  "timestamp": 1738857600000
}
```

### Authorization
Commands are authorized by Mosquitto ACL (only `uns-client` can write to `cmd/` topics). No additional JWT/API key validation in Phase 2.

### Verification
```bash
# Start a simulation via MQTT
mosquitto_pub -h localhost -u uns-client -P uns-client-dev \
  -t 'uns-simulator/_sys/cmd/simulation/start' \
  -m '{"profileId":"<id>","correlationId":"test-1"}'

# Watch for response
mosquitto_sub -h localhost -u uns-client -P uns-client-dev \
  -t 'uns-simulator/_sys/cmd-response/test-1'
```

---

## Phase 3: Frontend Real-Time Status via MQTT

**Status: Not Started**

Replace 10-second HTTP polling with MQTT WebSocket subscriptions.

### New Files
- `client/src/store/mqtt/systemMqttService.ts` - System topic subscriber

### Changes
- Frontend connects to broker via WebSocket as `uns-client`
- Subscribes to `uns-simulator/_sys/status/simulations/+`
- Incoming status messages dispatched to Redux store
- `SimulationControls.tsx` uses MQTT-driven status instead of polling
- Polling kept as fallback when MQTT connection is unavailable

### Considerations
- Client credentials: expose via backend `/health` endpoint or build-time env vars
- Connection lifecycle: connect on app mount, disconnect on logout
- MQTT Explorer: add visual badge to distinguish system topics from user data

---

## Phase 4: Full Data Plane + MCP Readiness

**Status: Not Started**

Complete read-only data plane over MQTT + MCP tool integration.

### Data Publishing
- GraphQL resolvers publish retained snapshots after mutations:
  - Schema create/update/delete -> `uns-simulator/_sys/data/schemas/{id}`
  - Profile create/update/delete -> `uns-simulator/_sys/data/profiles/{id}`
  - Broker create/update/delete -> `uns-simulator/_sys/data/brokers/{id}` (new topic)
- Index topics updated for discovery without wildcards

### CRUD over MQTT (Optional Extension)
- `uns-simulator/_sys/cmd/crud/{resource}/{action}` topics
- Create/update/delete schemas, profiles, brokers via MQTT
- Requires user identification in command payload (JWT or API key)

### MCP Tool Integration
- Document the MQTT API as an MCP-compatible interface
- Build MCP tools that:
  - Read application state from retained topics
  - Send commands to control simulations
  - Subscribe to events for monitoring
- Tools authenticate as `uns-client`

### Verification
```bash
# Read current schema definitions
mosquitto_sub -h localhost -u uns-client -P uns-client-dev \
  -t 'uns-simulator/_sys/data/schemas/#' -v -C 10

# Read profile configurations
mosquitto_sub -h localhost -u uns-client -P uns-client-dev \
  -t 'uns-simulator/_sys/data/profiles/#' -v -C 10
```

---

## Key Files

| File | Purpose |
|------|---------|
| `mqtt-broker/mosquitto.conf` | Broker config with ACL/passwd directives |
| `mqtt-broker/acl` | ACL rules for three user roles |
| `mqtt-broker/passwd` | Hashed password file (generated) |
| `mqtt-broker/generate-passwd.sh` | Password file generator script |
| `server/src/mqtt/topics.ts` | Topic path constants |
| `server/src/mqtt/MqttBackboneService.ts` | Core backbone service |
| `server/src/mqtt/commandHandler.ts` | Command dispatch (Phase 2) |
| `server/src/simulation/SimulationManager.ts` | Engine event forwarding |
| `server/src/index.ts` | Backbone startup/shutdown |
