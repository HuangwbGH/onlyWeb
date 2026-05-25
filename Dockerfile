FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_PATH=/app/data/onlyweb.db
ARG APP_PORT=18473
ENV PORT=${APP_PORT}
RUN apt-get update \
  && apt-get install -y --no-install-recommends libreoffice-writer fonts-noto-cjk fontconfig \
  && rm -rf /var/lib/apt/lists/*
ENV HOME=/tmp
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p /app/data /app/public/uploads/project-docs /app/public/uploads/project-doc-previews /app/public/uploads/profile \
  && chown -R nextjs:nodejs /app/data /app/public/uploads
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
RUN mkdir -p /app/public/uploads/project-docs /app/public/uploads/project-doc-previews /app/public/uploads/profile \
  && chown -R nextjs:nodejs /app/public/uploads
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE ${APP_PORT}
CMD ["node", "server.js"]
