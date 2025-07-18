import User from '../models/User';

export const userResolvers = {
  Query: {
    users: async () => await User.find(),
    user: async (_: any, { id }: { id: string }) => await User.findById(id),
  },
  Mutation: {
    createUser: async (_: any, { input }: any) => {
      const newUser = new User(input);
      await newUser.save();
      return newUser;
    },
  },
};
