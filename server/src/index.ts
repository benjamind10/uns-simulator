import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import compression from 'compression';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
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
import SimulationProfile from './graphql/models/SimulationProfile';
import simulationManager from './simulation/SimulationManager';
import {
  metricsRegistry,
  graphqlRequestsTotal,
  graphqlRequestDuration,
} from './metrics';

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

interface JwtPayload {
  userId: string;
  exp?: number;
  iat?: number;
  // Add other fields as needed
}

const getContext = async ({ req }: { req: express.Request }) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];

  if (!token) return {};

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const user = await User.findById(decoded.userId);
    if (!user) return {};
    return { user };
  } catch (err) {
    console.warn('❌ Invalid token:', (err as Error).message);
    // Do not log the actual token value for security
    return {};
  }
};

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
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // from .env or default 15 min
  max: Number(process.env.RATE_LIMIT_MAX) || 100, // from .env or default 100
  message: 'Too many requests from this IP, please try again later.',
});
if (process.env.ENABLE_RATE_LIMIT === 'true') {
  app.use(limiter);
}

// Health check endpoint (before CORS to avoid authentication issues)
app.get('/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbState = mongoose.connection.readyState;
    const dbStatus =
      dbState === 1
        ? 'connected'
        : dbState === 2
        ? 'connecting'
        : 'disconnected';

    // Get uptime
    const uptime = process.uptime();

    // Basic health response
    const health = {
      status: dbState === 1 ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      database: {
        status: dbStatus,
        name: process.env.DB_NAME || 'uns_simulator',
      },
      environment: process.env.NODE_ENV || 'development',
    };

    const statusCode = dbState === 1 ? 200 : 503;
    res.status(statusCode).json(health);
  } catch {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// Metrics endpoint (before CORS, like /health)
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  } catch {
    res.status(500).end();
  }
});

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
  plugins: [
    {
      async requestDidStart() {
        const start = process.hrtime.bigint();
        return {
          async willSendResponse(requestContext: any) {
            const operationName =
              requestContext.request.operationName || 'unknown';
            graphqlRequestsTotal.inc({ operation: operationName });
            const durationNs = Number(process.hrtime.bigint() - start);
            graphqlRequestDuration.observe(
              { operation: operationName },
              durationNs / 1e9
            );
          },
        };
      },
    },
  ],
});

// Cleanup orphaned simulation states on startup
const cleanupOrphanedSimulations = async () => {
  try {
    const result = await SimulationProfile.updateMany(
      {
        $or: [
          { 'status.state': 'running' },
          { 'status.state': 'paused' },
          { 'status.state': 'starting' },
          { 'status.state': 'stopping' },
        ],
      },
      {
        $set: {
          'status.state': 'stopped',
          'status.isRunning': false,
          'status.isPaused': false,
          'status.mqttConnected': false,
          'status.reconnectAttempts': 0,
          'status.error': 'Server restarted - simulation was terminated',
          'status.lastActivity': new Date(),
        },
      }
    );
    if (result.modifiedCount > 0) {
      console.log(
        `🧹 Cleaned up ${result.modifiedCount} orphaned simulation(s)`
      );
    }
  } catch (error) {
    console.error('❌ Failed to cleanup orphaned simulations:', error);
  }
};

// Connect to MongoDB and start the server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || '', {
      dbName: process.env.DB_NAME || 'unsdb',
    });
    console.log('✅ Connected to MongoDB');

    // Clean up any simulations that were running when server last stopped
    await cleanupOrphanedSimulations();

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

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  try {
    // Stop all running simulations
    console.log('🛑 Stopping all running simulations...');
    await simulationManager.stopAllSimulations();

    // Close database connection
    await mongoose.connection.close();
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Graceful shutdown on SIGTERM (Docker)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
