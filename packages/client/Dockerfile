FROM oven/bun:1-alpine AS build

WORKDIR /app

# Copy workspace files
COPY package.json bun.lockb ./

# Copy client package files
COPY packages/client/package.json ./packages/client/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy client source code
COPY packages/client ./packages/client

# Build client
RUN cd packages/client && bun run build

FROM nginx:alpine

COPY --from=build /app/packages/client/dist /usr/share/nginx/html

COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
