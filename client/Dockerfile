# SFSH client image: Vite build served by nginx.
# Build:  docker build -t sfsh-client ./client
#
# VITE_API_URL is inlined at build time.
#   "/" (default)            -> same-origin calls; nginx proxies /api and /api-docs to API_UPSTREAM.
#   "https://api.example.com" -> the browser calls that API directly (set its CORS_ORIGINS accordingly).
#
# API_UPSTREAM (runtime) is where nginx forwards /api; default http://api:4000 (the compose service).

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM nginx:1.27-alpine AS runtime
ENV API_UPSTREAM=http://api:4000
# nginx's entrypoint renders /etc/nginx/templates/*.template with envsubst on start.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
