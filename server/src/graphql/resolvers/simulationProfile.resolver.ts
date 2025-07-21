import { Types } from 'mongoose';
import SimulationProfile, {
  ISimulationProfile,
} from '../../graphql/models/SimulationProfile';
import {
  SimNodeBehaviorModel,
  ISimNodeBehaviorBase,
} from '../../graphql/models/simulation/SimNodeBehavior.base';

interface Context {
  user?: { _id: string };
}

/* ───────────────────────────────
   Helpers
────────────────────────────────*/
const requireAuth = (ctx: Context) => {
  if (!ctx.user) throw new Error('Unauthenticated');
};

/* ───────────────────────────────
   Resolvers
────────────────────────────────*/
export const simulationProfileResolvers = {
  /* ══════════ Query ══════════ */
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

    profileNodeBehaviors: async (
      _: any,
      { profileId }: { profileId: string },
      ctx: Context
    ) => {
      requireAuth(ctx);
      // quick auth check: profile must belong to user
      const owned = await SimulationProfile.exists({
        _id: profileId,
        userId: ctx.user!._id,
      });
      if (!owned) throw new Error('Forbidden');
      return SimNodeBehaviorModel.find({ profileId }).exec();
    },
  },

  /* ══════════ Mutation ══════════ */
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
      // delete profile
      await SimulationProfile.deleteOne({ _id: id, userId: ctx.user!._id });
      // cascade delete behaviours
      await SimNodeBehaviorModel.deleteMany({ profileId: id });
      return true;
    },

    /* ── Node-behaviour CRUD ── */

    upsertNodeBehaviors: async (
      _: any,
      {
        profileId,
        behaviors,
      }: { profileId: string; behaviors: ISimNodeBehaviorBase[] },
      ctx: Context
    ) => {
      requireAuth(ctx);
      // auth check once
      const owned = await SimulationProfile.exists({
        _id: profileId,
        userId: ctx.user!._id,
      });
      if (!owned) throw new Error('Forbidden');

      // remove existing for those nodeIds, then insertMany
      const nodeIds = behaviors.map((b) => new Types.ObjectId(b.nodeId));
      await SimNodeBehaviorModel.deleteMany({
        profileId,
        nodeId: { $in: nodeIds },
      });
      const docs = behaviors.map((b) => ({
        ...b,
        profileId,
      }));
      await SimNodeBehaviorModel.insertMany(docs);
      return true;
    },

    deleteNodeBehavior: async (
      _: any,
      { profileId, nodeId }: { profileId: string; nodeId: string },
      ctx: Context
    ) => {
      requireAuth(ctx);
      const owned = await SimulationProfile.exists({
        _id: profileId,
        userId: ctx.user!._id,
      });
      if (!owned) throw new Error('Forbidden');
      await SimNodeBehaviorModel.deleteOne({ profileId, nodeId });
      return true;
    },
  },

  /* ══════════ Field resolvers ══════════ */

  SimulationProfile: {
    nodeBehaviors: (parent: ISimulationProfile) =>
      SimNodeBehaviorModel.find({ profileId: parent._id }).exec(),
  },
};
