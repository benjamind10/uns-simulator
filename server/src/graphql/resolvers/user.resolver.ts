import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import User, { IUser } from '../models/User';
import Broker from '../models/Broker';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;

interface CreateUserInput {
  username: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export const userResolvers = {
  Query: {
    users: async () => await User.find(),
    user: async (_: {}, { id }: { id: string }) => await User.findById(id),
  },
  Mutation: {
    createUser: async (_: {}, { input }: { input: CreateUserInput }) => {
      const newUser = new User(input);
      await newUser.save();
      return newUser;
    },
    login: async (_: {}, { input }: { input: LoginInput }) => {
      const { email, password } = input;
      const user = await User.findOne({ email });
      if (!user) throw new Error('Invalid credentials');

      const isMatch = await user.comparePassword(password);
      if (!isMatch) throw new Error('Invalid credentials');

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: '1d',
      });

      return {
        token,
        user,
      };
    },
  },
  User: {
    brokers: async (parent: IUser) => {
      // Only return brokers that actually exist
      const brokers = await Broker.find({ _id: { $in: parent.brokers } });
      return brokers;
    },
  },
};
