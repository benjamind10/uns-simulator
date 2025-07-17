# server/Dockerfile

# 1. Use a Node.js base image
FROM node:20

# 2. Set working directory
WORKDIR /app

# 3. Copy package.json and yarn.lock first (for caching)
COPY package.json yarn.lock ./

# 4. Install dependencies
RUN yarn install

# 5. Copy the rest of the source code
COPY . .

# 6. Build TypeScript
RUN yarn build

# 7. Start the app
CMD ["node", "dist/index.js"]
