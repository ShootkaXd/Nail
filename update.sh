#!/usr/bin/env bash
# Update mechanism for Nail Studio (Docker deployment)
# Pulls latest code, rebuilds images, applies migrations and restarts.
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Fetching latest changes..."
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git fetch origin "$BRANCH"

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse "origin/$BRANCH")"

if [ "$LOCAL" = "$REMOTE" ]; then
  echo "==> Already up to date ($LOCAL)."
  exit 0
fi

echo "==> Updating $LOCAL -> $REMOTE"
git pull --ff-only origin "$BRANCH"

echo "==> Rebuilding and restarting containers..."
docker compose pull || true
docker compose up -d --build

echo "==> Pruning old images..."
docker image prune -f >/dev/null 2>&1 || true

echo "==> Update complete. Migrations run automatically on backend start."
