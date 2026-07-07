# Use node:20 (full image, includes Python + build tools for native addons like better-sqlite3)
FROM node:20

WORKDIR /app

# Copy and install server dependencies
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install

# Copy and build client
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

# Copy remaining server source
COPY server/ ./server/

# Copy built client into a location the server can serve
RUN cp -r client/dist server/dist

# Environment
ENV NODE_ENV=production
ENV PORT=8080
ENV DB_PATH=/data/data.db

RUN mkdir -p /data

EXPOSE 8080

WORKDIR /app/server
CMD ["node", "server.js"]
