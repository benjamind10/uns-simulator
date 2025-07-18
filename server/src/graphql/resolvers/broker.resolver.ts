import Broker from '../models/Broker';

export const brokerResolvers = {
  Query: {
    brokers: async () => await Broker.find(),
    broker: async (_: any, { id }: { id: string }) => await Broker.findById(id),
  },
  Mutation: {
    createBroker: async (_: any, { input }: any) => {
      const newBroker = new Broker(input);
      await newBroker.save();
      return newBroker;
    },
  },
};
