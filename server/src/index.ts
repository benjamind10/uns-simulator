import { ApolloServer } from 'apollo-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { userTypeDefs } from './graphql/schemas/user.schema';
import { userResolvers } from './graphql/resolvers/user.resolver';
import { brokerTypeDefs } from './graphql/schemas/broker.schema';
import { brokerResolvers } from './graphql/resolvers/broker.resolver';
import User from './graphql/models/User';

// Load environment variables
dotenv.config();

// Merge all schema parts
export const typeDefs = mergeTypeDefs([userTypeDefs, brokerTypeDefs]);
export const resolvers = mergeResolvers([userResolvers, brokerResolvers]);

// Apollo context for auth
const getContext = async ({ req }: { req: any }) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];

  if (!token) return {};

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await User.findById(decoded.userId);
    if (!user) return {};
    return { user };
  } catch (err) {
    console.warn('❌ Invalid token:', (err as Error).message);
    return {};
  }
};

// Add allowed origins based on environment
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000', // Production/Nginx
  process.env.CLIENT_URL, // Optional: Add from env if needed
].filter(Boolean); // Remove any undefined values

// Create Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: getContext,
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️ Blocked request from unauthorized origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Enable if you need to handle cookies/auth
  },
});

// Connect to MongoDB and start the server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || '', {
      dbName: process.env.DB_NAME || 'unsdb',
    });

    console.log('✅ Connected to MongoDB');

    const { url } = await server.listen({ port: process.env.PORT || 4000 });
    console.log(`🚀 Server ready at ${url}`);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
  }
};

startServer();
