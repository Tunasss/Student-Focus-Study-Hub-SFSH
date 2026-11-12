# SFSH API image (Express + Prisma, MySQL 8).
# Build:  docker build -t sfsh-api ./api
# Run:    docker run -p 4000:4000 -e DATABASE_URL=... -e JWT_SECRET=... sfsh-api
#
# On start the container applies pending Prisma migrations (`prisma migrate deploy`)
# and then starts the server. Set RUN_MIGRATIONS=false to skip that step
# (e.g. when the platform runs migrations as a separate pre-deploy job).

FROM node:22-bookworm-slim AS base
# Prisma's query engine needs OpenSSL; ca-certificates for TLS to hosted MySQL / Gemini.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- dependencies + Prisma client ----
FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
# Dev dependencies are kept on purpose: the Prisma CLI (a devDependency) is needed
# at runtime for `prisma migrate deploy`; eslint/supertest add only a few MB.
RUN npx prisma generate

# ---- runtime ----
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=4000 \
    RUN_MIGRATIONS=true
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json package-lock.json openapi.yaml ./
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node src ./src

USER node
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# exec so node receives SIGTERM directly (graceful shutdown in src/server.js).
CMD ["sh", "-c", "if [ \"$RUN_MIGRATIONS\" != \"false\" ]; then npx prisma migrate deploy; fi && exec node src/server.js"]
