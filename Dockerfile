FROM node:20-slim AS builder

WORKDIR /app

# Copy root package.json for workspace deps if any (not strictly needed, but good practice)
COPY package.json ./

# Copy client and server
COPY client/ ./client/
COPY server/ ./server/

# Build client
WORKDIR /app/client
RUN npm install
RUN npm run build

# Setup server
WORKDIR /app/server
RUN npm install

# Final production image
FROM node:20-slim

WORKDIR /app

# SQLite requires a few native dependencies occasionally, though better-sqlite3 usually provides prebuilds.
# Installing python3 and build-essential just in case, but usually node-slim is enough if prebuilds match.
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy client build
COPY --from=builder /app/client/dist /app/client/dist

# Copy server code and node_modules
COPY --from=builder /app/server /app/server

# Environment setup
ENV NODE_ENV=production
ENV PORT=8080
ENV DB_PATH=/data/data.db

WORKDIR /app/server

# Ensure the SQLite data directory is created
RUN mkdir -p /data

EXPOSE 8080

CMD ["node", "server.js"]
