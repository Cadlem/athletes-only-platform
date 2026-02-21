# athletes-only API Dockerfile
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy all package files for workspace
COPY package.json apps/*/package.json ./
COPY apps/api/package.json ./apps/api/

# Install dependencies (without frozen lockfile for initial install)
RUN pnpm install --no-frozen-lockfile

# Build the app
RUN pnpm --filter @athletes-only/api build

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "apps/api/dist/index.js"]
