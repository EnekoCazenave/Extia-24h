FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS dependencies
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/server/package.json packages/server/package.json
COPY packages/client/package.json packages/client/package.json
COPY packages/server/prisma packages/server/prisma
RUN npm ci && npm run db:generate

FROM dependencies AS build
COPY packages/shared packages/shared
COPY packages/server packages/server
COPY packages/client packages/client
ENV VITE_API_URL=/
RUN npm run build

FROM dependencies AS migrate
COPY docker/entrypoint.mjs docker/init-roles.mjs ./docker/
USER node
ENTRYPOINT ["node", "/app/docker/entrypoint.mjs"]
CMD ["sh", "-c", "npm run db:deploy && node docker/init-roles.mjs"]

FROM build AS production-dependencies
RUN npm prune --omit=dev

FROM base AS server
ENV NODE_ENV=production
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/server/package.json ./packages/server/package.json
COPY --from=build /app/packages/server/dist ./packages/server/dist
COPY docker/entrypoint.mjs ./docker/entrypoint.mjs
RUN mkdir -p packages/server/uploads && chown node:node packages/server/uploads
USER node
EXPOSE 3000
ENTRYPOINT ["node", "/app/docker/entrypoint.mjs"]
CMD ["node", "packages/server/dist/index.js"]

FROM caddy:2-alpine AS web
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/packages/client/dist /srv
EXPOSE 80 443
