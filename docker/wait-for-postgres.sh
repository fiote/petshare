#!/bin/sh
set -e

until pg_isready -h 127.0.0.1 -p 5432 -U "${DB_USERNAME}" >/dev/null 2>&1; do
  echo "Aguardando Postgres iniciar..."
  sleep 1
done

echo "Executando migrations..."
node_modules/.bin/typeorm migration:run -d dist/config/data-source.js

exec "$@"
