# ================================================================
# NETILY FRONTEND — Multi-stage Next.js Standalone Build
# ================================================================
# Produces a minimal ~120 MB image with node server.js
# ================================================================

# ── Stage 1: Install dependencies ──────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy lock + manifest
COPY package.json package-lock.json

# Install with npm (matches Vercel build; --legacy-peer-deps for compat)
RUN npm install --legacy-peer-deps

# ── Stage 2: Build ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Production API URL — baked into the Next.js bundle at build time
ARG NEXT_PUBLIC_API_URL=https://api.netily.co.ke/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build (standalone output enabled in next.config.mjs)
RUN npm run build

# ── Stage 3: Production runner ─────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone server + static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
