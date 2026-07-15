FROM node:20-alpine AS builder

WORKDIR /app
# Enable turbo cache
ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM
ARG TURBO_TOKEN
ENV TURBO_TOKEN=$TURBO_TOKEN

COPY package*.json ./
COPY turbo.json ./
COPY apps/web/package*.json ./apps/web/
RUN npm install

COPY apps/web ./apps/web

WORKDIR /app/apps/web
# NEXT_PUBLIC_API_URL should be provided at build time if it bakes into static pages, but it's often handled at runtime.
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Next.js standalone mode copies the necessary files, we copy from builder
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
