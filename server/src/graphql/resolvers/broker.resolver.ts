import { Schema, Types } from 'mongoose';
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
    brokers: async (_parent: any, _args: any, context: Context) => {
      if (!context.user) throw new Error('Unauthorized');
      const user = await User.findById(context.user._id).populate('brokers');
      return user?.brokers || [];
    },

    // Get a specific broker if the authenticated user has access to it
    broker: async (
      _parent: any,
      { id }: { id: string },
      context: Context
    ): Promise<IBroker | null> => {
      if (!context.user) throw new Error('Unauthorized');
      const broker = await Broker.findById(id);
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
      _parent: any,
      { input }: { input: CreateBrokerInput },
      context: Context
    ): Promise<IBroker> => {
      if (!context.user) throw new Error('Unauthorized');

      const broker = new Broker({
        ...input,
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
      _: unknown,
      { id }: { id: string },
      context: Context
    ): Promise<boolean> => {
      requireAuth(context);

      // Delete the broker
      await Broker.findByIdAndDelete(id);

      // Remove broker reference from all users
      await User.updateMany({ brokers: id }, { $pull: { brokers: id } });

      // Remove broker reference from all schemas (if applicable)
      await SchemaModel.updateMany(
        { brokerIds: id },
        { $pull: { brokerIds: id } }
      );

      return true;
    },

    // Update a broker
    updateBroker: async (
      _parent: any,
      { id, input }: { id: string; input: Partial<CreateBrokerInput> },
      context: Context
    ): Promise<IBroker> => {
      if (!context.user) throw new Error('Unauthorized');

      const broker = await Broker.findById(id);
      if (!broker) throw new Error('Broker not found');

      // Convert both to strings for comparison, just like in deleteBroker
      const userIds = (broker.users as Types.ObjectId[]).map((u) =>
        u.toString()
      );
      const contextUserId = context.user._id.toString();

      // Add the same debugging log as deleteBroker
      console.log('Checking access:', {
        brokerId: id,
        userId: contextUserId,
        allowedUsers: userIds,
        matches: userIds.includes(contextUserId),
      });

      if (!userIds.includes(contextUserId)) {
        throw new Error('Forbidden');
      }

      // Update the broker
      const updatedBroker = await Broker.findByIdAndUpdate(
        id,
        { $set: input },
        { new: true }
      );

      if (!updatedBroker) throw new Error('Failed to update broker');

      return updatedBroker;
    },
  },
};
function requireAuth(context: Context) {
  if (!context.user || !context.user._id) {
    throw new Error('Unauthorized');
  }
}
