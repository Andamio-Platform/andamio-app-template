# =============================================================================
# Andamio Frontend - Multi-stage Dockerfile
# =============================================================================
# Optimized for Next.js with standalone output mode
#
# Build-time environment variables (passed via --build-arg):
#   NEXT_PUBLIC_ANDAMIO_GATEWAY_URL - API Gateway URL
#   NEXT_PUBLIC_CARDANO_NETWORK     - Cardano network (preprod/preview/mainnet)
#   NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID - Access token policy ID
#
# Example build command:
#   docker build \
#     --build-arg NEXT_PUBLIC_ANDAMIO_GATEWAY_URL=https://dev.api.andamio.io \
#     --build-arg NEXT_PUBLIC_CARDANO_NETWORK=preprod \
#     --build-arg NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID=29aa6a65f5c890cfa428d59b15dec6293bf4ff0a94305c957508dc78 \
#     -t andamio-frontend .
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies based on lockfile present
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then \
    yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
RUN apk add --no-cache git
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables (NEXT_PUBLIC_* are embedded at build time)
ARG NEXT_PUBLIC_ANDAMIO_GATEWAY_URL
ARG NEXT_PUBLIC_CARDANO_NETWORK
ARG NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID

# Set environment for build
ENV NEXT_PUBLIC_ANDAMIO_GATEWAY_URL=${NEXT_PUBLIC_ANDAMIO_GATEWAY_URL}
ENV NEXT_PUBLIC_CARDANO_NETWORK=${NEXT_PUBLIC_CARDANO_NETWORK}
ENV NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID=${NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID}
ENV NEXT_TELEMETRY_DISABLED=1

# Skip T3 env validation at build time - server-side secrets are injected at runtime
ENV SKIP_ENV_VALIDATION=1

# Build the application
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm run build; \
  elif [ -f yarn.lock ]; then \
    yarn build; \
  else \
    npm run build; \
  fi

# -----------------------------------------------------------------------------
# Stage 3: Runner (Production)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy only necessary files for standalone mode
COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build (requires output: 'standalone' in next.config.js)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
