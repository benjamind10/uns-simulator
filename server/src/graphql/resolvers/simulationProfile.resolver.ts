import SimulationProfile, {
  ISimulationProfile,
} from '../../graphql/models/SimulationProfile';
import simulationManager from '../../simulation/SimulationManager';
import Broker from '../models/Broker';
import SchemaModel from '../models/Schema';

interface Context {
  user?: { _id: string };
}

interface NodeSettingsInput {
  frequency?: number;
  failRate?: number;
  payload?: {
    quality?: string;
    value?: any;
    timestamp?: number;
  };
}

const requireAuth = (ctx: Context) => {
  if (!ctx.user) throw new Error('Unauthenticated');
};

export const simulationProfileResolvers = {
  Query: {
    simulationProfiles: async (_: {}, __: {}, ctx: Context) => {
      requireAuth(ctx);
      return SimulationProfile.find({ userId: ctx.user!._id }).exec();
    },
    simulationProfile: async (_: {}, { id }: { id: string }, ctx: Context) => {
      requireAuth(ctx);
      const profile = await SimulationProfile.findOne({
        _id: id,
        userId: ctx.user!._id,
      }).exec();
      if (!profile) throw new Error('Profile not found');
      return profile;
    },
    simulationStatus: async (
      _: {},
      { profileId }: { profileId: string },
      ctx: Context
    ) => {
      // Optionally require auth
      requireAuth(ctx);
      const profile = await SimulationProfile.findById(profileId);
      if (!profile) throw new Error('Profile not found');
      // Always return a valid status object
      if (!profile.status) {
        // Provide default values if status is missing
        return {
          state: 'idle',
          isRunning: false,
          isPaused: false,
          startTime: null,
          lastActivity: null,
          nodeCount: 0,
          mqttConnected: false,
          reconnectAttempts: 0,
          error: null,
        };
      }
      return profile.status;
    },
  },

  Mutation: {
    createSimulationProfile: async (
      _: {},
      { input }: { input: Omit<ISimulationProfile, 'userId'> },
      ctx: Context
    ) => {
      requireAuth(ctx);
      const doc = await SimulationProfile.create({
        ...input,
        userId: ctx.user!._id,
      });
      return doc;
    },

    updateSimulationProfile: async (
      _: {},
      { id, input }: { id: string; input: Partial<ISimulationProfile> },
      ctx: Context
    ) => {
      requireAuth(ctx);
      const updated = await SimulationProfile.findOneAndUpdate(
        { _id: id, userId: ctx.user!._id },
        { $set: input },
        { new: true }
      ).exec();
      if (!updated) throw new Error('Profile not found');
      return updated;
    },

    deleteSimulationProfile: async (
      _: {},
      { id }: { id: string },
      ctx: Context
    ) => {
      requireAuth(ctx);
      await SimulationProfile.deleteOne({ _id: id, userId: ctx.user!._id });
      return true;
    },

    upsertNodeSettings: async (
      _: {},
      {
        profileId,
        nodeId,
        settings,
      }: {
        profileId: string;
        nodeId: string;
        settings: NodeSettingsInput;
      },
      ctx: Context
    ) => {
      requireAuth(ctx);
      await SimulationProfile.findOneAndUpdate(
        { _id: profileId, userId: ctx.user!._id }, // <-- add userId here
        { $set: { [`nodeSettings.${nodeId}`]: settings } },
        { new: true }
      );
      const updatedProfile = await SimulationProfile.findById(profileId);
      if (
        !updatedProfile ||
        !updatedProfile.nodeSettings ||
        !updatedProfile.nodeSettings[nodeId]
      ) {
        throw new Error('Node settings not found');
      }
      const nodeSetting = updatedProfile.nodeSettings[nodeId];
      return {
        nodeId,
        frequency: nodeSetting.frequency ?? null,
        failRate: nodeSetting.failRate ?? null,
        payload: nodeSetting.payload ?? null,
      };
    },

    deleteNodeSettings: async (
      _: {},
      { profileId, nodeId }: { profileId: string; nodeId: string },
      ctx: Context
    ) => {
      requireAuth(ctx);
      const profile = await SimulationProfile.findOne({
        _id: profileId,
        userId: ctx.user!._id,
      });
      if (!profile) throw new Error('Profile not found');
      if (profile.nodeSettings && profile.nodeSettings[nodeId]) {
        delete profile.nodeSettings[nodeId];
        await profile.save();
      }
      return true;
    },

    startSimulation: async (_: any, { profileId }: { profileId: string }) => {
      // Fetch profile, schema, and broker from DB
      const profile = await SimulationProfile.findById(profileId);
      if (!profile) throw new Error('Profile not found');
      const schema = await SchemaModel.findById(profile.schemaId);
      if (!schema) throw new Error('Schema not found');
      const broker = await Broker.findById(profile.brokerId);
      if (!broker) throw new Error('Broker not found');

      // Start simulation via SimulationManager
      await simulationManager.startSimulation(profile, schema, broker);

      return true;
    },

    stopSimulation: async (_: any, { profileId }: { profileId: string }) => {
      await simulationManager.stopSimulation(profileId);
      return true;
    },

    pauseSimulation: async (_: any, { profileId }: { profileId: string }) => {
      await simulationManager.pauseSimulation(profileId);
      return true;
    },

    resumeSimulation: async (_: any, { profileId }: { profileId: string }) => {
      await simulationManager.resumeSimulation(profileId);
      return true;
    },
  },

  SimulationProfile: {
    nodeSettings: (profile: ISimulationProfile) => {
      // Mongoose Map support
      const nodeSettingsMap =
        profile.nodeSettings instanceof Map
          ? profile.nodeSettings
          : new Map(Object.entries(profile.nodeSettings || {}));
      return Array.from(nodeSettingsMap.entries()).map(
        ([nodeId, settings]) => ({
          nodeId,
          frequency: settings.frequency ?? null,
          failRate: settings.failRate ?? null,
          payload: settings.payload ?? null,
        })
      );
    },
  },
};
