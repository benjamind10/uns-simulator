import { Types } from 'mongoose';

import { createMockContext } from '../helpers/mockContext';

const mockProfileFindOne = jest.fn();
const mockProfileFindOneAndUpdate = jest.fn();
const mockBrokerFindOne = jest.fn();

jest.mock('../../graphql/models/SimulationProfile', () => {
  const MockProfile = jest.fn();
  (MockProfile as any).findOne = (...args: any[]) => mockProfileFindOne(...args);
  (MockProfile as any).findOneAndUpdate = (...args: any[]) => mockProfileFindOneAndUpdate(...args);
  return { __esModule: true, default: MockProfile };
});

jest.mock('../../graphql/models/Broker', () => {
  const MockBroker = jest.fn();
  (MockBroker as any).findOne = (...args: any[]) => mockBrokerFindOne(...args);
  return { __esModule: true, default: MockBroker };
});

jest.mock('../../graphql/models/Schema', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../simulation/SimulationManager', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../mqtt/MqttBackboneService', () => ({
  __esModule: true,
  default: {},
}));

// Require after mocks are set up
const { simulationProfileResolvers } = require('../../graphql/resolvers/simulationProfile.resolver');

describe('simulationProfileResolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mutation.updateSimulationProfile - broker validation', () => {
    const userId = new Types.ObjectId();
    const profileId = new Types.ObjectId().toString();
    const brokerId1 = new Types.ObjectId().toString();
    const brokerId2 = new Types.ObjectId().toString();

    it('allows broker change when simulation is stopped', async () => {
      const context = createMockContext(userId.toString());

      // Mock existing profile with stopped state
      const existingProfile = {
        _id: profileId,
        userId,
        brokerId: brokerId1,
        status: { state: 'stopped' },
      };
      mockProfileFindOne.mockResolvedValue(existingProfile);

      // Mock broker validation
      const validBroker = {
        _id: brokerId2,
        users: [userId],
      };
      mockBrokerFindOne.mockResolvedValue(validBroker);

      // Mock successful update
      const updatedProfile = {
        ...existingProfile,
        brokerId: brokerId2,
      };
      mockProfileFindOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedProfile),
      });

      const result = await simulationProfileResolvers.Mutation.updateSimulationProfile(
        {},
        { id: profileId, input: { brokerId: brokerId2 } },
        context
      );

      expect(result.brokerId).toBe(brokerId2);
      expect(mockBrokerFindOne).toHaveBeenCalledWith({
        _id: brokerId2,
        users: userId.toString(),
      });
    });

    it('rejects broker change when simulation is running', async () => {
      const context = createMockContext(userId.toString());

      const existingProfile = {
        _id: profileId,
        userId,
        brokerId: brokerId1,
        status: { state: 'running' },
      };
      mockProfileFindOne.mockResolvedValue(existingProfile);

      await expect(
        simulationProfileResolvers.Mutation.updateSimulationProfile(
          {},
          { id: profileId, input: { brokerId: brokerId2 } },
          context
        )
      ).rejects.toThrow('Cannot change broker while simulation is active');
    });

    it('rejects broker change when simulation is starting', async () => {
      const context = createMockContext(userId.toString());

      const existingProfile = {
        _id: profileId,
        userId,
        brokerId: brokerId1,
        status: { state: 'starting' },
      };
      mockProfileFindOne.mockResolvedValue(existingProfile);

      await expect(
        simulationProfileResolvers.Mutation.updateSimulationProfile(
          {},
          { id: profileId, input: { brokerId: brokerId2 } },
          context
        )
      ).rejects.toThrow('Cannot change broker while simulation is active');
    });

    it('rejects broker change when simulation is paused', async () => {
      const context = createMockContext(userId.toString());

      const existingProfile = {
        _id: profileId,
        userId,
        brokerId: brokerId1,
        status: { state: 'paused' },
      };
      mockProfileFindOne.mockResolvedValue(existingProfile);

      await expect(
        simulationProfileResolvers.Mutation.updateSimulationProfile(
          {},
          { id: profileId, input: { brokerId: brokerId2 } },
          context
        )
      ).rejects.toThrow('Cannot change broker while simulation is active');
    });

    it('rejects broker change to non-existent broker', async () => {
      const context = createMockContext(userId.toString());

      const existingProfile = {
        _id: profileId,
        userId,
        brokerId: brokerId1,
        status: { state: 'stopped' },
      };
      mockProfileFindOne.mockResolvedValue(existingProfile);

      // Mock broker not found
      mockBrokerFindOne.mockResolvedValue(null);

      await expect(
        simulationProfileResolvers.Mutation.updateSimulationProfile(
          {},
          { id: profileId, input: { brokerId: brokerId2 } },
          context
        )
      ).rejects.toThrow('Broker not found or access denied');
    });

    it('rejects broker change to broker user lacks access to', async () => {
      const context = createMockContext(userId.toString());

      const existingProfile = {
        _id: profileId,
        userId,
        brokerId: brokerId1,
        status: { state: 'stopped' },
      };
      mockProfileFindOne.mockResolvedValue(existingProfile);

      // Mock broker with different user - query won't match due to user filter
      mockBrokerFindOne.mockResolvedValue(null);

      await expect(
        simulationProfileResolvers.Mutation.updateSimulationProfile(
          {},
          { id: profileId, input: { brokerId: brokerId2 } },
          context
        )
      ).rejects.toThrow('Broker not found or access denied');
    });

    it('allows setting brokerId to null', async () => {
      const context = createMockContext(userId.toString());

      const existingProfile = {
        _id: profileId,
        userId,
        brokerId: brokerId1,
        status: { state: 'stopped' },
      };
      mockProfileFindOne.mockResolvedValue(existingProfile);

      const updatedProfile = {
        ...existingProfile,
        brokerId: null,
      };
      mockProfileFindOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedProfile),
      });

      const result = await simulationProfileResolvers.Mutation.updateSimulationProfile(
        {},
        { id: profileId, input: { brokerId: null } },
        context
      );

      expect(result.brokerId).toBeNull();
      expect(mockBrokerFindOne).not.toHaveBeenCalled(); // Null allowed without validation
    });

    it('allows updating other fields without triggering broker validation', async () => {
      const context = createMockContext(userId.toString());

      const existingProfile = {
        _id: profileId,
        userId,
        brokerId: brokerId1,
        status: { state: 'running' }, // Even if running
        globalSettings: { defaultUpdateFrequency: 1000 },
      };
      mockProfileFindOne.mockResolvedValue(existingProfile);

      const updatedProfile = {
        ...existingProfile,
        globalSettings: { defaultUpdateFrequency: 2000 },
      };
      mockProfileFindOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedProfile),
      });

      const result = await simulationProfileResolvers.Mutation.updateSimulationProfile(
        {},
        {
          id: profileId,
          input: { globalSettings: { defaultUpdateFrequency: 2000 } }
        },
        context
      );

      expect(result.globalSettings.defaultUpdateFrequency).toBe(2000);
      expect(mockBrokerFindOne).not.toHaveBeenCalled(); // No broker validation
    });

    it('throws when profile not found', async () => {
      const context = createMockContext(userId.toString());

      mockProfileFindOne.mockResolvedValue(null);

      await expect(
        simulationProfileResolvers.Mutation.updateSimulationProfile(
          {},
          { id: profileId, input: { brokerId: brokerId2 } },
          context
        )
      ).rejects.toThrow('Profile not found');
    });
  });
});
