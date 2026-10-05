# Build the React SPA; no Node runtime is needed in the serving image.
FROM node:24-alpine3.20@sha256:8fe019e0d57dbdce5f5c27c0b63d2775cf34b00e3755a7dea969802d7e0c2b25 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV VITE_API_BASE_URL=/lq/api/v1
RUN npm run build

FROM caddy:2-alpine@sha256:6aeddd44c3078b0f9a35206472a11420648a79c184603ef95957d0a20044cb2b
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
# Standalone educational documents, not Svelte components.
COPY --from=learning-artifacts . /srv/learn
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --retries=5 CMD wget -qO- http://localhost:8080/health || exit 1
