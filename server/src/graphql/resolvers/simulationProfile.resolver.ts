import SimulationProfile, {
  ISimulationProfile,
} from '../../graphql/models/SimulationProfile';

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
      console.log('Updated profile:', updatedProfile); // Debug
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
