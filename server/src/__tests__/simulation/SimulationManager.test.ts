import { SimulationManager } from '../../simulation/SimulationManager';
import { SimulationEngine } from '../../simulation/SimulationEngine';
import SimulationProfile from '../../graphql/models/SimulationProfile';
import {
  createMockProfile,
  createMockSchema,
  createMockBroker,
} from '../helpers/mockContext';

jest.mock('../../simulation/SimulationEngine');
jest.mock('../../graphql/models/SimulationProfile');

const MockedEngine = SimulationEngine as jest.MockedClass<
  typeof SimulationEngine
>;

describe('SimulationManager', () => {
  let manager: SimulationManager;

  beforeEach(() => {
    manager = new SimulationManager();
    MockedEngine.mockClear();
  });

  describe('startSimulation', () => {
    it('creates a new engine and calls start', async () => {
      const profile = createMockProfile();
      const schema = createMockSchema();
      const broker = createMockBroker();

      const mockStart = jest.fn().mockResolvedValue(undefined);
      MockedEngine.prototype.start = mockStart;

      await manager.startSimulation(profile as any, schema as any, broker as any);

      expect(MockedEngine).toHaveBeenCalledWith(profile, schema, broker);
      expect(mockStart).toHaveBeenCalled();
    });

    it('stops existing engine before starting a new one', async () => {
      const profile = createMockProfile();
      const schema = createMockSchema();
      const broker = createMockBroker();

      const mockStop = jest.fn().mockResolvedValue(undefined);
      const mockStart = jest.fn().mockResolvedValue(undefined);
      MockedEngine.prototype.stop = mockStop;
      MockedEngine.prototype.start = mockStart;

      // Start first simulation
      await manager.startSimulation(profile as any, schema as any, broker as any);
      // Start again with same profile
      await manager.startSimulation(profile as any, schema as any, broker as any);

      expect(mockStop).toHaveBeenCalledTimes(1);
      expect(mockStart).toHaveBeenCalledTimes(2);
    });
  });

  describe('stopSimulation', () => {
    it('stops engine and removes it from the map', async () => {
      const profile = createMockProfile();
      const schema = createMockSchema();
      const broker = createMockBroker();

      const mockStop = jest.fn().mockResolvedValue(undefined);
      const mockStart = jest.fn().mockResolvedValue(undefined);
      MockedEngine.prototype.stop = mockStop;
      MockedEngine.prototype.start = mockStart;

      await manager.startSimulation(profile as any, schema as any, broker as any);
      await manager.stopSimulation(profile.id);

      expect(mockStop).toHaveBeenCalled();
      expect(manager.getSimulationStatus(profile.id)).toBeNull();
    });

    it('updates DB status when engine not in memory', async () => {
      const fakeId = 'nonexistent-id';
      (SimulationProfile.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await manager.stopSimulation(fakeId);

      expect(SimulationProfile.findByIdAndUpdate).toHaveBeenCalledWith(
        fakeId,
        expect.objectContaining({
          $set: expect.objectContaining({
            'status.state': 'stopped',
            'status.isRunning': false,
          }),
        })
      );
    });
  });

  describe('pauseSimulation', () => {
    it('calls pause on the engine', async () => {
      const profile = createMockProfile();
      const schema = createMockSchema();
      const broker = createMockBroker();

      const mockPause = jest.fn();
      const mockStart = jest.fn().mockResolvedValue(undefined);
      MockedEngine.prototype.pause = mockPause;
      MockedEngine.prototype.start = mockStart;

      await manager.startSimulation(profile as any, schema as any, broker as any);
      await manager.pauseSimulation(profile.id);

      expect(mockPause).toHaveBeenCalled();
    });

    it('throws when engine not found', async () => {
      await expect(manager.pauseSimulation('nonexistent')).rejects.toThrow(
        'Simulation not running'
      );
    });
  });

  describe('resumeSimulation', () => {
    it('calls resume on the engine', async () => {
      const profile = createMockProfile();
      const schema = createMockSchema();
      const broker = createMockBroker();

      const mockResume = jest.fn();
      const mockStart = jest.fn().mockResolvedValue(undefined);
      MockedEngine.prototype.resume = mockResume;
      MockedEngine.prototype.start = mockStart;

      await manager.startSimulation(profile as any, schema as any, broker as any);
      await manager.resumeSimulation(profile.id);

      expect(mockResume).toHaveBeenCalled();
    });

    it('throws when engine not found', async () => {
      await expect(manager.resumeSimulation('nonexistent')).rejects.toThrow(
        'Simulation not found'
      );
    });
  });

  describe('isRunning', () => {
    it('returns false when no engine exists', () => {
      expect(manager.isRunning('nonexistent')).toBe(false);
    });

    it('delegates to engine getStatus', async () => {
      const profile = createMockProfile();
      const schema = createMockSchema();
      const broker = createMockBroker();

      MockedEngine.prototype.start = jest.fn().mockResolvedValue(undefined);
      MockedEngine.prototype.getStatus = jest.fn().mockReturnValue({
        isRunning: true,
      });

      await manager.startSimulation(profile as any, schema as any, broker as any);
      expect(manager.isRunning(profile.id)).toBe(true);
    });
  });

  describe('getSimulationStatus', () => {
    it('returns null when no engine exists', () => {
      expect(manager.getSimulationStatus('nonexistent')).toBeNull();
    });
  });

  describe('stopAllSimulations', () => {
    it('stops all running engines', async () => {
      const profile1 = createMockProfile();
      const profile2 = createMockProfile();
      const schema = createMockSchema();
      const broker = createMockBroker();

      const mockStop = jest.fn().mockResolvedValue(undefined);
      const mockStart = jest.fn().mockResolvedValue(undefined);
      MockedEngine.prototype.stop = mockStop;
      MockedEngine.prototype.start = mockStart;

      await manager.startSimulation(profile1 as any, schema as any, broker as any);
      await manager.startSimulation(profile2 as any, schema as any, broker as any);
      await manager.stopAllSimulations();

      expect(mockStop).toHaveBeenCalledTimes(2);
    });
  });
});
