import { ApolloServer } from 'apollo-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { userTypeDefs } from './graphql/schemas/user.schema';
import { userResolvers } from './graphql/resolvers/user.resolver';
import { brokerTypeDefs } from './graphql/schemas/broker.schema';
import { brokerResolvers } from './graphql/resolvers/broker.resolver';

// Load environment variables
dotenv.config();

export const typeDefs = mergeTypeDefs([userTypeDefs, brokerTypeDefs]);
export const resolvers = mergeResolvers([userResolvers, brokerResolvers]);

// Create Apollo Server instance
const server = new ApolloServer({ typeDefs, resolvers });

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || '', {
      dbName: 'uns-simulator',
    });

    console.log('✅ Connected to MongoDB');

    const { url } = await server.listen({ port: 4000 });
    console.log(`🚀 Server ready at ${url}`);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
  }
};

startServer();
