# ========================================================
# CryptoWhale AI Pro - Production Multi-Stage Dockerfile
# ========================================================

# Stage 1: Build Frontend Assets
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package.json ./

# Install dependencies (ignoring scripts)
RUN npm install

# Copy application source
COPY . .

# Build Vite frontend bundle
RUN npm run build

# Stage 2: Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DISABLE_HMR=true

# Copy package definitions and install production packages
COPY package.json ./
RUN npm install --omit=dev && npm install -g tsx

# Copy built frontend from Stage 1
COPY --from=builder /app/dist ./dist

# Copy server and service source code
COPY server.ts ./
COPY src/services ./src/services
COPY src/types ./src/types

# Expose HTTP port
EXPOSE 3000

# Health check to ensure 24/7 uptime
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/ping || exit 1

# Launch Quantitative Trading Engine
CMD ["tsx", "server.ts"]
