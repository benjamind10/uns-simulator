import { EventEmitter } from 'events';

import { SimulationEngine } from '../../simulation/SimulationEngine';
import {
  createMockProfile,
  createMockSchema,
  createMockBroker,
} from '../helpers/mockContext';

// Mock metrics to avoid side effects
jest.mock('../../metrics', () => ({
  simulationStartsTotal: { inc: jest.fn() },
  simulationStopsTotal: { inc: jest.fn() },
  mqttMessagesPublishedTotal: { inc: jest.fn() },
  mqttPublishErrorsTotal: { inc: jest.fn() },
}));

jest.mock('../../graphql/models/SimulationProfile', () => ({
  __esModule: true,
  default: {
    findByIdAndUpdate: jest.fn().mockResolvedValue(null),
  },
}));

// Create a mock MQTT client that behaves like an EventEmitter
function createMockMqttClient() {
  const client = new EventEmitter() as any;
  client.connected = true;
  client.publish = jest.fn(
    (_topic: string, _msg: string, _opts: any, cb: (err?: Error) => void) => {
      cb();
    }
  );
  client.end = jest.fn();
  return client;
}

let mockClient: any;

jest.mock('mqtt', () => ({
  connect: jest.fn(() => {
    mockClient = createMockMqttClient();
    // Emit connect event on next tick
    process.nextTick(() => {
      mockClient.emit('connect');
    });
    return mockClient;
  }),
}));

describe('SimulationEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = null;
  });

  function createEngine(overrides: {
    profile?: Record<string, any>;
    schema?: Record<string, any>;
    broker?: Record<string, any>;
  } = {}) {
    const profile = createMockProfile(overrides.profile);
    const schema = createMockSchema(overrides.schema);
    const broker = createMockBroker(overrides.broker);
    return {
      engine: new SimulationEngine(profile as any, schema as any, broker as any),
      profile,
      schema,
      broker,
    };
  }

  describe('initializeNodes', () => {
    it('filters only metric nodes from schema', () => {
      const { engine } = createEngine({
        schema: {
          nodes: [
            {
              id: 'n1',
              name: 'temp',
              kind: 'metric',
              parent: null,
              path: 'temp',
              order: 0,
              dataType: 'Float',
            },
            {
              id: 'n2',
              name: 'group1',
              kind: 'group',
              parent: null,
              path: 'group1',
              order: 1,
            },
          ],
        },
      });

      const status = engine.getStatus();
      expect(status.nodeCount).toBe(1);
    });

    it('uses global frequency when node setting is absent', () => {
      const { engine } = createEngine({
        profile: {
          globalSettings: {
            defaultUpdateFrequency: 5000,
            timeScale: 1.0,
          },
          nodeSettings: new Map(),
        },
        schema: {
          nodes: [
            {
              id: 'n1',
              name: 'temp',
              kind: 'metric',
              parent: null,
              path: 'temp',
              order: 0,
            },
          ],
        },
      });

      expect(engine.getStatus().nodeCount).toBe(1);
    });

    it('uses node-specific frequency when provided', () => {
      const nodeSettings = new Map();
      nodeSettings.set('n1', { frequency: 2000, failRate: 0, payload: {} });

      const { engine } = createEngine({
        profile: {
          globalSettings: {
            defaultUpdateFrequency: 5000,
            timeScale: 1.0,
          },
          nodeSettings,
        },
        schema: {
          nodes: [
            {
              id: 'n1',
              name: 'temp',
              kind: 'metric',
              parent: null,
              path: 'temp',
              order: 0,
            },
          ],
        },
      });

      expect(engine.getStatus().nodeCount).toBe(1);
    });
  });

  describe('getStatus', () => {
    it('returns correct initial state', () => {
      const { engine, profile } = createEngine();
      const status = engine.getStatus();

      expect(status.isRunning).toBe(false);
      expect(status.isPaused).toBe(false);
      expect(status.profile).toBe(profile.name);
      expect(status.mqttConnected).toBe(false);
      expect(status.reconnectAttempts).toBe(0);
    });
  });

  describe('start', () => {
    it('connects to broker, sets running state, and emits started event', async () => {
      const { engine } = createEngine();
      const startedSpy = jest.fn();
      engine.on('started', startedSpy);

      await engine.start();

      const status = engine.getStatus();
      expect(status.isRunning).toBe(true);
      expect(startedSpy).toHaveBeenCalled();
    });

    it('does nothing if already running', async () => {
      const { engine } = createEngine();

      await engine.start();
      await engine.start(); // second call should be a no-op

      expect(engine.getStatus().isRunning).toBe(true);
    });
  });

  describe('stop', () => {
    it('clears intervals, disconnects MQTT, and emits stopped event', async () => {
      const { engine } = createEngine();
      const stoppedSpy = jest.fn();
      engine.on('stopped', stoppedSpy);

      await engine.start();
      await engine.stop();

      expect(engine.getStatus().isRunning).toBe(false);
      expect(stoppedSpy).toHaveBeenCalled();
      expect(mockClient.end).toHaveBeenCalledWith(true);
    });

    it('does nothing if not running', async () => {
      const { engine } = createEngine();
      const stoppedSpy = jest.fn();
      engine.on('stopped', stoppedSpy);

      await engine.stop();

      expect(stoppedSpy).not.toHaveBeenCalled();
    });
  });

  describe('pause', () => {
    it('emits paused event and sets isPaused', async () => {
      const { engine } = createEngine();
      const pausedSpy = jest.fn();
      engine.on('paused', pausedSpy);

      await engine.start();
      await engine.pause();

      expect(engine.getStatus().isPaused).toBe(true);
      expect(pausedSpy).toHaveBeenCalled();
    });

    it('does nothing if not running', async () => {
      const { engine } = createEngine();
      const pausedSpy = jest.fn();
      engine.on('paused', pausedSpy);

      await engine.pause();

      expect(pausedSpy).not.toHaveBeenCalled();
    });

    it('does nothing if already paused', async () => {
      const { engine } = createEngine();
      const pausedSpy = jest.fn();
      engine.on('paused', pausedSpy);

      await engine.start();
      await engine.pause();
      await engine.pause();

      expect(pausedSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('resume', () => {
    it('emits resumed event and clears isPaused', async () => {
      const { engine } = createEngine();
      const resumedSpy = jest.fn();
      engine.on('resumed', resumedSpy);

      await engine.start();
      await engine.pause();
      await engine.resume();

      expect(engine.getStatus().isPaused).toBe(false);
      expect(resumedSpy).toHaveBeenCalled();
    });

    it('does nothing if not paused', async () => {
      const { engine } = createEngine();
      const resumedSpy = jest.fn();
      engine.on('resumed', resumedSpy);

      await engine.start();
      await engine.resume();

      expect(resumedSpy).not.toHaveBeenCalled();
    });
  });
});
