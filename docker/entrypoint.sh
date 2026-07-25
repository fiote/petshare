#!/bin/sh
set -e

for var in DB_HOST DB_PORT DB_USERNAME DB_PASSWORD DB_NAME; do
  eval "value=\$$var"
  if [ -z "$value" ]; then
    echo "Erro: variável de ambiente $var não configurada. Defina-a no .env antes de iniciar." >&2
    exit 1
  fi
done

PGDATA=/var/lib/postgresql/data
export PGDATA

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "Inicializando cluster Postgres..."
  mkdir -p "$PGDATA"
  chown -R postgres:postgres "$PGDATA"
  su postgres -c "/usr/lib/postgresql/16/bin/initdb -D $PGDATA --auth=trust --username=postgres"

  cat >> "$PGDATA/postgresql.conf" <<EOF
listen_addresses = '127.0.0.1'
EOF

  su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D $PGDATA -o '-c config_file=$PGDATA/postgresql.conf' -w start"

  su postgres -c "psql -v ON_ERROR_STOP=1 --username postgres" <<-EOSQL
    CREATE USER ${DB_USERNAME} WITH PASSWORD '${DB_PASSWORD}';
    CREATE DATABASE ${DB_NAME} OWNER ${DB_USERNAME};
EOSQL

  su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D $PGDATA -w stop"
else
  echo "Cluster Postgres já inicializado."
fi

chown -R postgres:postgres "$PGDATA"

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
