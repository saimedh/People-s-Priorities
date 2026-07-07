FROM node:20-slim AS builder

WORKDIR /app

# Copy root package.json
COPY package.json ./

# Copy client and server directories
COPY client/ ./client/
COPY server/ ./server/

# Install dependencies and build the app
RUN npm run install:all && npm run build

# Final production image
FROM node:20-slim

WORKDIR /app

# Copy built artifacts from the builder stage
COPY --from=builder /app /app

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# The root package.json now handles cd into server and running npm start
CMD ["npm", "start"]
