import { Types } from 'mongoose';
import User from '../models/User';
import Broker, { IBroker } from '../models/Broker';

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
  },
};
