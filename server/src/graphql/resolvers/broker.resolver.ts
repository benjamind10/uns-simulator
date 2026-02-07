import { Types } from 'mongoose';
import mongoose from 'mongoose';

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

      // Start a MongoDB session for transaction
      const session = await mongoose.startSession();

      try {
        // Start transaction
        await session.startTransaction();

        // Get count of affected simulation profiles
        const SimulationProfile = (await import('../models/SimulationProfile')).default;
        const affectedProfiles = await SimulationProfile.countDocuments({
          brokerId: args.id,
        }).session(session);

        // Delete the broker
        await Broker.findByIdAndDelete(args.id).session(session);

        // Remove broker reference from all users
        await User.updateMany(
          { brokers: args.id },
          { $pull: { brokers: args.id } }
        ).session(session);

        // Remove broker reference from all schemas (if applicable)
        await SchemaModel.updateMany(
          { brokerIds: args.id },
          { $pull: { brokerIds: args.id } }
        ).session(session);

        // Clear brokerId from all simulation profiles using this broker
        if (affectedProfiles > 0) {
          await SimulationProfile.updateMany(
            { brokerId: args.id },
            { $unset: { brokerId: '' } }
          ).session(session);
          console.log(
            `🗑️  Deleted broker and cleared reference from ${affectedProfiles} simulation profile(s)`
          );
        }

        // Commit the transaction
        await session.commitTransaction();
        return true;
      } catch (error) {
        // Abort transaction on any error
        await session.abortTransaction();
        console.error('❌ Transaction aborted due to error:', error);

        // Re-throw the error to propagate it to the client
        throw error;
      } finally {
        // Always end the session
        await session.endSession();
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
    // Never return passwords to clients for security
    password: () => null,
  },
};

function requireAuth(context: Context) {
  if (!context.user || !context.user._id) {
    throw new Error('Unauthorized');
  }
}
