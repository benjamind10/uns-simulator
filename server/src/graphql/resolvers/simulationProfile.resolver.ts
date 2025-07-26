import { Types } from 'mongoose';

import SimulationProfile, {
  ISimulationProfile,
} from '../../graphql/models/SimulationProfile';

interface Context {
  user?: { _id: string };
}

const requireAuth = (ctx: Context) => {
  if (!ctx.user) throw new Error('Unauthenticated');
};

export const simulationProfileResolvers = {
  Query: {
    simulationProfiles: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      return SimulationProfile.find({ userId: ctx.user!._id }).exec();
    },
    simulationProfile: async (_: any, { id }: { id: string }, ctx: Context) => {
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
      _: any,
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
      _: any,
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
      _: any,
      { id }: { id: string },
      ctx: Context
    ) => {
      requireAuth(ctx);
      await SimulationProfile.deleteOne({ _id: id, userId: ctx.user!._id });
      return true;
    },

    // Upsert node settings for a profile (add or update per-node settings)
    upsertNodeSettings: async (
      _: any,
      {
        profileId,
        nodeId,
        settings,
      }: {
        profileId: string;
        nodeId: string;
        settings: {
          frequency?: number;
          failRate?: number;
          payload?: {
            quality?: string;
            value?: string | number;
            timestamp?: number;
          };
        };
      },
      ctx: Context
    ) => {
      requireAuth(ctx);
      const profile = await SimulationProfile.findOne({
        _id: profileId,
        userId: ctx.user!._id,
      });
      if (!profile) throw new Error('Profile not found');
      profile.nodeSettings = profile.nodeSettings || {};
      profile.nodeSettings[nodeId] = {
        ...profile.nodeSettings[nodeId],
        ...settings,
      };
      await profile.save();
      return profile.nodeSettings[nodeId];
    },

    // Remove node settings for a profile
    deleteNodeSettings: async (
      _: any,
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
};
