# athletes-only API Dockerfile
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the app
RUN pnpm --filter @athletes-only/api build

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "apps/api/dist/index.js"]
