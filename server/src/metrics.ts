import client from 'prom-client';

// Create a custom registry
export const metricsRegistry = new client.Registry();

// Collect default metrics (CPU, memory, event loop lag, etc.)
client.collectDefaultMetrics({ register: metricsRegistry });

// --- Simulation metrics ---

export const simulationStartsTotal = new client.Counter({
  name: 'simulation_starts_total',
  help: 'Total number of simulations started',
  registers: [metricsRegistry],
});

export const simulationStopsTotal = new client.Counter({
  name: 'simulation_stops_total',
  help: 'Total number of simulations stopped',
  registers: [metricsRegistry],
});

export const mqttMessagesPublishedTotal = new client.Counter({
  name: 'mqtt_messages_published_total',
  help: 'Total MQTT messages published by simulations',
  registers: [metricsRegistry],
});

export const mqttPublishErrorsTotal = new client.Counter({
  name: 'mqtt_publish_errors_total',
  help: 'Total MQTT publish errors',
  registers: [metricsRegistry],
});

// --- GraphQL metrics ---

export const graphqlRequestsTotal = new client.Counter({
  name: 'graphql_requests_total',
  help: 'Total GraphQL requests',
  labelNames: ['operation'] as const,
  registers: [metricsRegistry],
});

export const graphqlRequestDuration = new client.Histogram({
  name: 'graphql_request_duration_seconds',
  help: 'GraphQL request duration in seconds',
  labelNames: ['operation'] as const,
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [metricsRegistry],
});
