export const productionConfig = {
  mongodb: {
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
  server: {
    trustProxy: true, // Enable if you're behind a reverse proxy (Heroku, Nginx, etc)
    timeoutSeconds: 60,
  },
  security: {
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100, // requests per window
    passwordMinLength: 8,
    jwtExpiresIn: '1d',
  },
};
