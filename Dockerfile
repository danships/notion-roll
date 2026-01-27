FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/notion-roll/package.json ./packages/notion-roll/
COPY packages/notion-roll-server/package.json ./packages/notion-roll-server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY tsconfig.base.json ./
COPY packages/notion-roll/ ./packages/notion-roll/
COPY packages/notion-roll-server/ ./packages/notion-roll-server/

# Build
RUN pnpm build

FROM node:20-alpine AS runner

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/packages/notion-roll-server/dist ./dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]
