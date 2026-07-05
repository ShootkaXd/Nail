# Debian-based image: Prisma engines work out of the box (glibc + OpenSSL 3),
# unlike Alpine/musl which needs fragile libssl workarounds.

# ---- Build stage ----
FROM node:20-slim AS build
WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Runtime stage ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# prisma is a production dependency, so migrate deploy works offline at startup
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=build /app/dist ./dist

# Run as the non-root user provided by the node image
RUN mkdir -p /app/data /app/uploads && chown -R node:node /app
USER node

EXPOSE 3000

# Apply migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
