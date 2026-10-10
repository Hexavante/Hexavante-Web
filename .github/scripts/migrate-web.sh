#!/bin/sh
# Executado na VPS via: ssh ... 'sh -s' < .github/scripts/migrate-web.sh
# Aplica as migrações Prisma pendentes do web somente se a única pendência
# for a migration deste deploy; aborta diante de qualquer outra pendência.
set -eu

echo "MIGRATE_SCRIPT_START user=$(whoami) shell=$(command -v sh)"

c=$(docker ps -q -f name=^hexavante-web$ | head -n1)
if [ -z "$c" ]; then c=$(docker ps -q -f name=^hexavante-app$ | head -n1); fi
if [ -z "$c" ]; then
  echo "container web nao encontrado"
  docker ps
  exit 1
fi
echo "container=$(docker inspect -f '{{.Name}}' "$c")"

s=$(docker exec "$c" npx prisma migrate status 2>&1 || true)
echo "$s"

if echo "$s" | grep -qiE 'P1[0-9]{3}|error:'; then
  echo "migrate status com erro — abortando"
  exit 1
fi

p=$(echo "$s" | awk '/have not yet been applied/{f=1;next} /^To apply migrations|^Database schema/{f=0} f' | tr -d '\r' | grep -E '^[0-9]{6,}' || true)
if [ -z "$p" ]; then
  echo "Nenhuma migracao pendente."
  exit 0
fi
echo "Pendentes:"
echo "$p"

if [ "$(echo "$p" | grep -c .)" -ne 1 ] || ! echo "$p" | grep -q "20261010000000_registration_preferences"; then
  echo "Pendencias inesperadas (fora da migracao deste deploy) — abortando migrate deploy automatico."
  exit 1
fi

docker exec "$c" npx prisma migrate deploy
echo "MIGRATE_SCRIPT_OK"
