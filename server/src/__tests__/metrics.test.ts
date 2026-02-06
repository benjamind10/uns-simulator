import {
  metricsRegistry,
  simulationStartsTotal,
  simulationStopsTotal,
  mqttMessagesPublishedTotal,
  mqttPublishErrorsTotal,
  graphqlRequestsTotal,
  graphqlRequestDuration,
} from '../metrics';

describe('metrics', () => {
  beforeEach(async () => {
    metricsRegistry.resetMetrics();
  });

  it('exports all expected metrics', async () => {
    const metrics = await metricsRegistry.getMetricsAsJSON();
    const names = metrics.map((m) => m.name);

    expect(names).toContain('simulation_starts_total');
    expect(names).toContain('simulation_stops_total');
    expect(names).toContain('mqtt_messages_published_total');
    expect(names).toContain('mqtt_publish_errors_total');
    expect(names).toContain('graphql_requests_total');
    expect(names).toContain('graphql_request_duration_seconds');
  });

  it('increments simulation counters', async () => {
    simulationStartsTotal.inc();
    simulationStartsTotal.inc();
    simulationStopsTotal.inc();

    const startsValue = (await simulationStartsTotal.get()).values[0].value;
    const stopsValue = (await simulationStopsTotal.get()).values[0].value;

    expect(startsValue).toBe(2);
    expect(stopsValue).toBe(1);
  });

  it('increments MQTT counters', async () => {
    mqttMessagesPublishedTotal.inc();
    mqttPublishErrorsTotal.inc();

    const pubValue = (await mqttMessagesPublishedTotal.get()).values[0].value;
    const errValue = (await mqttPublishErrorsTotal.get()).values[0].value;

    expect(pubValue).toBe(1);
    expect(errValue).toBe(1);
  });

  it('increments GraphQL counters with labels', async () => {
    graphqlRequestsTotal.inc({ operation: 'getSchemas' });
    graphqlRequestsTotal.inc({ operation: 'getSchemas' });
    graphqlRequestsTotal.inc({ operation: 'login' });

    const values = (await graphqlRequestsTotal.get()).values;
    const schemaOps = values.find(
      (v) => v.labels.operation === 'getSchemas'
    );
    const loginOps = values.find((v) => v.labels.operation === 'login');

    expect(schemaOps?.value).toBe(2);
    expect(loginOps?.value).toBe(1);
  });

  it('observes GraphQL request duration', async () => {
    graphqlRequestDuration.observe({ operation: 'test' }, 0.05);

    const values = (await graphqlRequestDuration.get()).values;
    expect(values.length).toBeGreaterThan(0);
  });

  it('returns Prometheus text format', async () => {
    simulationStartsTotal.inc();
    const output = await metricsRegistry.metrics();

    expect(output).toContain('simulation_starts_total');
    expect(typeof output).toBe('string');
  });
});
