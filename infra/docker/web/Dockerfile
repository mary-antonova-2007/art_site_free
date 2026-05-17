FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@10.8.0

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/blocks/package.json packages/blocks/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS build
ENV DOCKER_BUILD=1
COPY . .
WORKDIR /app/apps/web
RUN ./node_modules/.bin/next build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
