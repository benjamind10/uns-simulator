import { Types } from 'mongoose';

import User from '../models/User';
import Broker, { IBroker } from '../models/Broker';
import SchemaModel from '../models/Schema';

interface CreateBrokerInput {
  name: string;
  url: string;
  port: number;
  clientId: string;
  username?: string;
  password?: string;
}

interface Context {
  user?: {
    _id: string;
  };
}

export const brokerResolvers = {
  Query: {
    // Get all brokers associated with the authenticated user
    brokers: async (_parent: {}, _args: {}, context: Context) => {
      if (!context.user) throw new Error('Unauthorized');
      const user = await User.findById(context.user._id).populate('brokers');
      return user?.brokers || [];
    },

    // Get a specific broker if the authenticated user has access to it
    broker: async (
      _parent: {},
      args: { id: string },
      context: Context
    ): Promise<IBroker | null> => {
      if (!context.user) throw new Error('Unauthorized');
      const broker = await Broker.findById(args.id);
      if (!broker) throw new Error('Broker not found');

      const userIds = (broker.users as Types.ObjectId[]).map((u) =>
        u.toString()
      );
      if (!userIds.includes(context.user._id)) {
        throw new Error('Forbidden');
      }

      return broker;
    },
  },

  Mutation: {
    // Create a new broker and associate it with the current user
    createBroker: async (
      _parent: {},
      args: { input: CreateBrokerInput },
      context: Context
    ): Promise<IBroker> => {
      if (!context.user) throw new Error('Unauthorized');

      const broker = new Broker({
        ...args.input,
        users: [context.user._id],
      });

      await broker.save();
      // Also push the broker ID into the user's list
      await User.findByIdAndUpdate(context.user._id, {
        $push: { brokers: broker._id },
      });

      return broker;
    },

    // Delete a broker
    deleteBroker: async (
      _parent: {},
      args: { id: string },
      context: Context
    ): Promise<boolean> => {
      requireAuth(context);

      try {
        const SimulationProfile = (await import('../models/SimulationProfile')).default;
        const isValidObjectId = Types.ObjectId.isValid(args.id);
        const affectedProfiles = isValidObjectId
          ? await SimulationProfile.countDocuments({ brokerId: args.id })
          : 0;

        // Delete the broker
        await Broker.findByIdAndDelete(args.id);

        // Remove broker reference from all users
        await User.updateMany(
          { brokers: args.id },
          { $pull: { brokers: args.id } }
        );

        // Remove broker reference from all schemas (if applicable)
        await SchemaModel.updateMany(
          { brokerIds: args.id },
          { $pull: { brokerIds: args.id } }
        );

        // Clear brokerId from all simulation profiles using this broker
        if (isValidObjectId && affectedProfiles > 0) {
          await SimulationProfile.updateMany(
            { brokerId: args.id },
            { $unset: { brokerId: '' } }
          );
          console.log(
            `🗑️  Deleted broker and cleared reference from ${affectedProfiles} simulation profile(s)`
          );
        }

        return true;
      } catch (error) {
        console.error('❌ Error deleting broker:', error);
        throw error;
      }
    },

    // Update a broker
    updateBroker: async (
      _parent: {},
      args: { id: string; input: Partial<CreateBrokerInput> },
      context: Context
    ): Promise<IBroker> => {
      if (!context.user) throw new Error('Unauthorized');

      const broker = await Broker.findById(args.id);
      if (!broker) throw new Error('Broker not found');

      const userIds = (broker.users as Types.ObjectId[]).map((u) =>
        u.toString()
      );
      const contextUserId = context.user._id.toString();

      if (!userIds.includes(contextUserId)) {
        throw new Error('Forbidden');
      }

      const updatedBroker = await Broker.findByIdAndUpdate(
        args.id,
        { $set: args.input },
        { new: true }
      );

      if (!updatedBroker) throw new Error('Failed to update broker');

      return updatedBroker;
    },
  },

  Broker: {
    id: (parent: any) => parent._id || parent.id,
  },
};

function requireAuth(context: Context) {
  if (!context.user || !context.user._id) {
    throw new Error('Unauthorized');
  }
}
