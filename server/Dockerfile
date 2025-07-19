FROM node:20-alpine

WORKDIR /app

# Add Python and build tools for bcrypt and other native dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies including devDependencies needed for build
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Install only production dependencies
RUN npm ci --only=production

# Environment variables
ENV PORT=5000
ENV NODE_ENV=production

# Expose the port
EXPOSE 5000

# Start the server using the compiled JavaScript
CMD ["node", "dist/index.js"]