FROM oven/bun:1-alpine

WORKDIR /app

# Copy workspace files
COPY package.json bun.lockb ./

# Copy server package files
COPY packages/server/package.json ./packages/server/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy server source code
COPY packages/server ./packages/server

# Install postgresql-client for migrations
RUN apk add --no-cache postgresql-client

EXPOSE 3000

WORKDIR /app/packages/server

CMD sh -c "sleep 5 && psql $DATABASE_URL -f src/db/schema.sql 2>/dev/null || true && bun run src/index.ts"
