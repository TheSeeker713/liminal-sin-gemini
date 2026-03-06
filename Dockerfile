# ── Stage 1: Build ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install all deps (devDeps needed for tsc)
COPY package*.json ./
RUN npm ci

# Copy source and compile to dist/
COPY tsconfig.json ./
COPY server/ ./server/
RUN npx tsc --project server/tsconfig.build.json

# ── Stage 2: Run ──────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Production deps only — no devDeps in the final image
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JS from builder
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
# Cloud Run injects PORT=8080 at runtime; this is the fallback default
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/server/server.js"]
