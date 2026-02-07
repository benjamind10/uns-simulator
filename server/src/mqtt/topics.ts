/**
 * MQTT Backbone System Topic Definitions
 *
 * All system topics live under the `uns-simulator/_sys/` prefix,
 * clearly separated from user-defined simulation data topics.
 */

const PREFIX = 'uns-simulator/_sys';

export const TOPICS = {
  // ── Status (retained) ──────────────────────────────────────────
  STATUS_SERVER: `${PREFIX}/status/server`,
  STATUS_SIMULATION: (id: string) => `${PREFIX}/status/simulations/${id}`,
  STATUS_SIMULATIONS_INDEX: `${PREFIX}/status/simulations/_index`,
  STATUS_BROKER: (id: string) => `${PREFIX}/status/brokers/${id}`,
  STATUS_BROKERS_INDEX: `${PREFIX}/status/brokers/_index`,

  // ── Events (non-retained) ─────────────────────────────────────
  EVENTS_SYSTEM: `${PREFIX}/events/system`,
  EVENTS_SIMULATION: `${PREFIX}/events/simulation`,

  // ── Commands ─────────────────────────────────────────────────
  CMD_SIMULATION_START: `${PREFIX}/cmd/simulation/start`,
  CMD_SIMULATION_STOP: `${PREFIX}/cmd/simulation/stop`,
  CMD_SIMULATION_PAUSE: `${PREFIX}/cmd/simulation/pause`,
  CMD_SIMULATION_RESUME: `${PREFIX}/cmd/simulation/resume`,
  CMD_WILDCARD: `${PREFIX}/cmd/#`,

  // ── Command Responses ────────────────────────────────────────
  CMD_RESPONSE: (correlationId: string) =>
    `${PREFIX}/cmd-response/${correlationId}`,

  // ── Data Snapshots (future phases, retained) ──────────────────
  DATA_SCHEMA: (id: string) => `${PREFIX}/data/schemas/${id}`,
  DATA_SCHEMAS_INDEX: `${PREFIX}/data/schemas/_index`,
  DATA_PROFILE: (id: string) => `${PREFIX}/data/profiles/${id}`,
  DATA_PROFILES_INDEX: `${PREFIX}/data/profiles/_index`,
} as const;
