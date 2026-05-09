#!/usr/bin/env sh
set -eu

# Helpful for logs
echo "[entrypoint] Starting backend container"

# Optional DB wait (Compose healthcheck should handle most of this)
if [ "${DB_HOST:-}" != "" ]; then
  echo "[entrypoint] DB_HOST=${DB_HOST}"
fi

echo "[entrypoint] Applying migrations..."
python manage.py migrate --noinput

echo "[entrypoint] Collecting static..."
python manage.py collectstatic --noinput || true

echo "[entrypoint] Ensuring admin user exists..."
python manage.py create_admin || true

echo "[entrypoint] Launching: $*"
exec sh -c "$*"
