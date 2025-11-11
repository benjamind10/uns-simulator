# Use Node 20 Alpine for smaller image
FROM node:20-alpine

WORKDIR /app

# Install system dependencies for native modules (bcrypt, etc.)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    wget

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for TypeScript build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Environment variables (can be overridden by docker-compose)
ENV PORT=4000
ENV NODE_ENV=production

# Expose the port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Start the server using the compiled JavaScript
CMD ["node", "dist/index.js"]