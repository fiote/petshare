# --- Build da API (NestJS) ---
FROM node:20-bookworm-slim AS api-build
WORKDIR /build/api
COPY api/package*.json ./
RUN npm ci
COPY api/ ./
RUN npm run build

# --- Build do Front (React + Vite) ---
FROM node:20-bookworm-slim AS web-build
WORKDIR /build/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# --- Imagem final: Postgres + Node + Nginx + supervisord ---
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates gnupg lsb-release nginx supervisor postgresql-common \
    && install -d /usr/share/postgresql-common/pgdg \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
        -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
    && echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] \
        https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
        > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update && apt-get install -y --no-install-recommends postgresql-16 \
    && apt-get purge -y gnupg lsb-release \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# API: dependências de produção + build compilado
COPY api/package*.json ./api/
RUN cd api && npm ci --omit=dev
COPY --from=api-build /build/api/dist ./api/dist

# Front: build estático servido pelo nginx
COPY --from=web-build /build/web/dist ./web/dist

# Configuração de infraestrutura
COPY docker/nginx.conf /etc/nginx/sites-available/default
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /app/docker/entrypoint.sh
COPY docker/wait-for-postgres.sh /app/docker/wait-for-postgres.sh
COPY docker/mark-initial-migration-applied.sh /app/docker/mark-initial-migration-applied.sh
RUN chmod +x /app/docker/entrypoint.sh /app/docker/wait-for-postgres.sh /app/docker/mark-initial-migration-applied.sh \
    && mkdir -p /var/lib/postgresql/data /var/log/supervisor /app/uploads/pet-photos \
    && chown -R postgres:postgres /var/lib/postgresql \
    && chown -R node:node /app/api /app/uploads

ENV PORT=5003 \
    DB_HOST=127.0.0.1 \
    DB_PORT=5432 \
    DB_USERNAME=petshare \
    DB_PASSWORD=petshare \
    DB_NAME=petshare \
    NODE_ENV=production \
    PET_PHOTOS_DIR=/app/uploads/pet-photos

EXPOSE 5000

ENTRYPOINT ["/app/docker/entrypoint.sh"]
