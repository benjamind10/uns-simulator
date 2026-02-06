import { Types } from 'mongoose';

export function createMockContext(userId?: string) {
  return {
    user: userId ? { _id: userId } : undefined,
  };
}

export function createAuthenticatedContext() {
  return createMockContext(new Types.ObjectId().toString());
}

export function createMockBroker(overrides: Record<string, any> = {}) {
  return {
    _id: new Types.ObjectId(),
    name: 'Test Broker',
    url: 'localhost',
    port: 1883,
    clientId: 'test-client',
    users: [new Types.ObjectId()],
    ssl: false,
    isConnected: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function createMockSchema(overrides: Record<string, any> = {}) {
  return {
    _id: new Types.ObjectId(),
    name: 'Test Schema',
    description: 'Test schema description',
    nodes: [
      {
        id: 'node-1',
        _id: new Types.ObjectId(),
        name: 'temperature',
        kind: 'metric' as const,
        parent: null,
        path: 'temperature',
        order: 0,
        dataType: 'Float' as const,
      },
      {
        id: 'node-2',
        _id: new Types.ObjectId(),
        name: 'plant',
        kind: 'group' as const,
        parent: null,
        path: 'plant',
        order: 1,
      },
    ],
    users: [new Types.ObjectId()],
    brokerIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function createMockProfile(overrides: Record<string, any> = {}) {
  const id = new Types.ObjectId();
  return {
    _id: id,
    id: id.toString(),
    name: 'Test Profile',
    description: 'Test profile description',
    schemaId: new Types.ObjectId(),
    brokerId: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    globalSettings: {
      defaultUpdateFrequency: 1000,
      timeScale: 1.0,
      publishRoot: '',
    },
    nodeSettings: new Map(),
    status: {
      state: 'idle' as const,
      isRunning: false,
      isPaused: false,
    },
    ...overrides,
  };
}
