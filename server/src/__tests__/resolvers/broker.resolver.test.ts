import { Types } from 'mongoose';

import { createMockContext, createAuthenticatedContext } from '../helpers/mockContext';

const mockUserFindById = jest.fn();
const mockUserFindByIdAndUpdate = jest.fn();
const mockUserUpdateMany = jest.fn();
const mockBrokerFindById = jest.fn();
const mockBrokerFindByIdAndUpdate = jest.fn();
const mockBrokerFindByIdAndDelete = jest.fn();
const mockBrokerSave = jest.fn();
const mockSchemaUpdateMany = jest.fn();

jest.mock('../../graphql/models/User', () => ({
  __esModule: true,
  default: {
    findById: (...args: any[]) => mockUserFindById(...args),
    findByIdAndUpdate: (...args: any[]) => mockUserFindByIdAndUpdate(...args),
    updateMany: (...args: any[]) => mockUserUpdateMany(...args),
  },
}));

jest.mock('../../graphql/models/Broker', () => {
  const MockBroker = jest.fn().mockImplementation((data: any) => ({
    ...data,
    save: (...args: any[]) => mockBrokerSave(...args),
  }));
  (MockBroker as any).findById = (...args: any[]) =>
    mockBrokerFindById(...args);
  (MockBroker as any).findByIdAndUpdate = (...args: any[]) =>
    mockBrokerFindByIdAndUpdate(...args);
  (MockBroker as any).findByIdAndDelete = (...args: any[]) =>
    mockBrokerFindByIdAndDelete(...args);
  return { __esModule: true, default: MockBroker };
});

jest.mock('../../graphql/models/Schema', () => ({
  __esModule: true,
  default: {
    updateMany: (...args: any[]) => mockSchemaUpdateMany(...args),
  },
}));

// Require after mocks are set up
const { brokerResolvers } = require('../../graphql/resolvers/broker.resolver');

describe('brokerResolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.brokers', () => {
    it('returns user brokers when authenticated', async () => {
      const context = createAuthenticatedContext();
      const mockBrokers = [{ name: 'Broker 1' }];
      mockUserFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ brokers: mockBrokers }),
      });

      const result = await brokerResolvers.Query.brokers({}, {}, context);

      expect(result).toEqual(mockBrokers);
    });

    it('throws when not authenticated', async () => {
      const context = createMockContext();

      await expect(
        brokerResolvers.Query.brokers({}, {}, context)
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('Query.broker', () => {
    it('returns broker when user has access', async () => {
      const userId = new Types.ObjectId();
      const context = createMockContext(userId.toString());
      const mockBroker = {
        _id: 'broker-1',
        name: 'Test',
        users: [userId],
      };
      mockBrokerFindById.mockResolvedValue(mockBroker);

      const result = await brokerResolvers.Query.broker(
        {},
        { id: 'broker-1' },
        context
      );

      expect(result).toEqual(mockBroker);
    });

    it('throws Forbidden when user lacks access', async () => {
      const context = createAuthenticatedContext();
      const otherUserId = new Types.ObjectId();
      mockBrokerFindById.mockResolvedValue({
        users: [otherUserId],
      });

      await expect(
        brokerResolvers.Query.broker({}, { id: 'broker-1' }, context)
      ).rejects.toThrow('Forbidden');
    });

    it('throws when broker not found', async () => {
      const context = createAuthenticatedContext();
      mockBrokerFindById.mockResolvedValue(null);

      await expect(
        brokerResolvers.Query.broker({}, { id: 'bad-id' }, context)
      ).rejects.toThrow('Broker not found');
    });
  });

  describe('Mutation.createBroker', () => {
    it('creates broker and updates user', async () => {
      const context = createAuthenticatedContext();
      const input = {
        name: 'New Broker',
        url: 'localhost',
        port: 1883,
        clientId: 'client-1',
      };
      mockBrokerSave.mockResolvedValue(undefined);
      mockUserFindByIdAndUpdate.mockResolvedValue(null);

      await brokerResolvers.Mutation.createBroker({}, { input }, context);

      expect(mockBrokerSave).toHaveBeenCalled();
      expect(mockUserFindByIdAndUpdate).toHaveBeenCalled();
    });

    it('throws when not authenticated', async () => {
      const context = createMockContext();

      await expect(
        brokerResolvers.Mutation.createBroker(
          {},
          {
            input: {
              name: 'x',
              url: 'x',
              port: 1883,
              clientId: 'x',
            },
          },
          context
        )
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('Mutation.deleteBroker', () => {
    it('deletes broker and removes references', async () => {
      const context = createAuthenticatedContext();
      mockBrokerFindByIdAndDelete.mockResolvedValue(null);
      mockUserUpdateMany.mockResolvedValue(null);
      mockSchemaUpdateMany.mockResolvedValue(null);

      const result = await brokerResolvers.Mutation.deleteBroker(
        {},
        { id: 'broker-1' },
        context
      );

      expect(result).toBe(true);
      expect(mockBrokerFindByIdAndDelete).toHaveBeenCalledWith('broker-1');
      expect(mockUserUpdateMany).toHaveBeenCalled();
      expect(mockSchemaUpdateMany).toHaveBeenCalled();
    });
  });

  describe('Mutation.updateBroker', () => {
    it('updates broker when user is authorized', async () => {
      const userId = new Types.ObjectId();
      const context = createMockContext(userId.toString());
      mockBrokerFindById.mockResolvedValue({
        users: [userId],
      });
      mockBrokerFindByIdAndUpdate.mockResolvedValue({
        _id: 'broker-1',
        name: 'Updated',
      });

      const result = await brokerResolvers.Mutation.updateBroker(
        {},
        { id: 'broker-1', input: { name: 'Updated' } },
        context
      );

      expect(result!.name).toBe('Updated');
    });

    it('throws Forbidden when user lacks access', async () => {
      const context = createAuthenticatedContext();
      mockBrokerFindById.mockResolvedValue({
        users: [new Types.ObjectId()],
      });

      await expect(
        brokerResolvers.Mutation.updateBroker(
          {},
          { id: 'broker-1', input: { name: 'x' } },
          context
        )
      ).rejects.toThrow('Forbidden');
    });

    it('allows clearing username and password with empty strings', async () => {
      const userId = new Types.ObjectId();
      const context = createMockContext(userId.toString());
      mockBrokerFindById.mockResolvedValue({
        users: [userId],
      });
      mockBrokerFindByIdAndUpdate.mockResolvedValue({
        _id: 'broker-1',
        name: 'Test Broker',
        username: '',
        password: '',
      });

      const result = await brokerResolvers.Mutation.updateBroker(
        {},
        { id: 'broker-1', input: { username: '', password: '' } },
        context
      );

      expect(mockBrokerFindByIdAndUpdate).toHaveBeenCalledWith(
        'broker-1',
        { $set: { username: '', password: '' } },
        { new: true }
      );
      expect(result!.username).toBe('');
      expect(result!.password).toBe('');
    });

    it('updates username and password to new values', async () => {
      const userId = new Types.ObjectId();
      const context = createMockContext(userId.toString());
      mockBrokerFindById.mockResolvedValue({
        users: [userId],
      });
      mockBrokerFindByIdAndUpdate.mockResolvedValue({
        _id: 'broker-1',
        name: 'Test Broker',
        username: 'newuser',
        password: 'newpass',
      });

      const result = await brokerResolvers.Mutation.updateBroker(
        {},
        { id: 'broker-1', input: { username: 'newuser', password: 'newpass' } },
        context
      );

      expect(mockBrokerFindByIdAndUpdate).toHaveBeenCalledWith(
        'broker-1',
        { $set: { username: 'newuser', password: 'newpass' } },
        { new: true }
      );
      expect(result!.username).toBe('newuser');
      expect(result!.password).toBe('newpass');
    });
  });
});
