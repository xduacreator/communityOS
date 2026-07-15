FROM node:20-alpine AS builder

WORKDIR /app

# Enable turbo cache
ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM
ARG TURBO_TOKEN
ENV TURBO_TOKEN=$TURBO_TOKEN

# First install dependencies for caching
COPY package*.json ./
COPY turbo.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm install

# Then copy the rest of the application
COPY apps/api ./apps/api

# Generate prisma client and build
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package*.json ./apps/api/
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["sh", "-c", "npx prisma generate && npm run start:prod"]
