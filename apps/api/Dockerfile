FROM node:20-alpine AS builder
# Set working directory
WORKDIR /app
# Install turbo globally
RUN npm install -g turbo
COPY . .
# Prune the workspace for api
RUN turbo prune @repo/api --docker

# Installer phase
FROM node:20-alpine AS installer
WORKDIR /app

# Enable turbo cache
ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM
ARG TURBO_TOKEN
ENV TURBO_TOKEN=$TURBO_TOKEN

# First install dependencies
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm install

# Build the project
COPY --from=builder /app/out/full/ .

# Generate prisma client before build
WORKDIR /app/apps/api
RUN npx prisma generate
WORKDIR /app

RUN npx turbo run build --filter=@repo/api...

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# We only need the api files in production
COPY --from=installer /app/package*.json ./
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/api/package*.json ./apps/api/
COPY --from=installer /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=installer /app/apps/api/dist ./apps/api/dist
COPY --from=installer /app/apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api

EXPOSE 3001

# Push the schema and run the production build
CMD ["sh", "-c", "npx prisma db push && npx prisma generate && npm run start:prod"]
