import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import compression from 'compression';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { jwtDecode } from 'jwt-decode';
import { ApolloServer } from 'apollo-server-express';

import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { userTypeDefs } from './graphql/schemas/user.schema';
import { userResolvers } from './graphql/resolvers/user.resolver';
import { brokerTypeDefs } from './graphql/schemas/broker.schema';
import { brokerResolvers } from './graphql/resolvers/broker.resolver';
import { schemaTypeDefs } from './graphql/schemas/schema.schema';
import { schemaResolvers } from './graphql/resolvers/schema.resolver';
import { simulationProfileTypeDefs } from './graphql/schemas/simulationProfile.schema';
import { simulationProfileResolvers } from './graphql/resolvers/simulationProfile.resolver';
import User from './graphql/models/User';

// Load environment variables
dotenv.config();

// Merge all schema parts
export const typeDefs = mergeTypeDefs([
  userTypeDefs,
  brokerTypeDefs,
  schemaTypeDefs,
  simulationProfileTypeDefs,
]);
export const resolvers = mergeResolvers([
  userResolvers,
  brokerResolvers,
  schemaResolvers,
  simulationProfileResolvers,
]);

// Apollo context for auth
const getContext = async ({ req }: { req: any }) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];

  if (!token) return {};

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    console.log('Decoded token:', decoded, 'Now:', Date.now() / 1000);
    const user = await User.findById(decoded.userId);
    if (!user) return {};
    return { user };
  } catch (err) {
    console.warn('❌ Invalid token:', (err as Error).message, 'Token:', token);
    return {};
  }
};

function isTokenExpired(token: string) {
  try {
    const decoded: any = jwtDecode(token);
    if (!decoded.exp) return false;
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// Add allowed origins based on environment
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000', // Production/Nginx
  'https://studio.apollographql.com',
  process.env.CLIENT_URL, // From env
].filter(Boolean);

// Create Express app
const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
  })
);

// Enable gzip compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️ Blocked request from unauthorized origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Create Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: getContext,
});

// Connect to MongoDB and start the server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || '', {
      dbName: process.env.DB_NAME || 'unsdb',
    });
    console.log('✅ Connected to MongoDB');

    await server.start();
    server.applyMiddleware({
      app,
      cors: false, // We're handling CORS with the express middleware
    });

    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      console.log(
        `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
      );
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();
