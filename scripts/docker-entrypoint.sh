#!/bin/sh
set -e

# Garante URLs públicas corretas mesmo se .env local vazou para o container
if [ "$NODE_ENV" = "production" ]; then
  case "${AUTH_URL:-}" in
    ""|http://localhost*|http://127.0.0.1*)
      export AUTH_URL="https://hexavante.com.br"
      ;;
  esac
  case "${NEXTAUTH_URL:-}" in
    ""|http://localhost*|http://127.0.0.1*)
      export NEXTAUTH_URL="https://hexavante.com.br"
      ;;
  esac
fi

echo "Iniciando Hexavante..."
exec su-exec nextjs node server.js
