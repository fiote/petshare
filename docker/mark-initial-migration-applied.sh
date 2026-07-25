#!/bin/sh
# Roda UMA VEZ contra um banco que já tem o schema criado via synchronize:true
# (deploys existentes antes da migration InitialSchema1784902935595 existir).
# Marca essa migration como já aplicada sem re-executar o SQL, já que o schema
# já bate. Rodar de dentro do container antes/depois do primeiro deploy com a
# nova imagem: docker exec -it <container> /app/docker/mark-initial-migration-applied.sh
set -e

: "${DB_USERNAME:?DB_USERNAME não configurado}"
: "${DB_NAME:?DB_NAME não configurado}"

PSQL="psql -h 127.0.0.1 -U ${DB_USERNAME} -d ${DB_NAME}"

$PSQL -v ON_ERROR_STOP=1 <<-EOSQL
  CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    timestamp bigint NOT NULL,
    name character varying NOT NULL
  );

  INSERT INTO migrations (timestamp, name)
  SELECT 1784902935595, 'InitialSchema1784902935595'
  WHERE NOT EXISTS (
    SELECT 1 FROM migrations WHERE name = 'InitialSchema1784902935595'
  );
EOSQL

echo "Migration InitialSchema1784902935595 marcada como aplicada."
