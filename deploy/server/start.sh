#!/bin/sh
set -eu
cd "$(dirname "$0")"
release="${1:?release identifier is required}"
python3 configure.py "$release"
docker build -t "winx-runtime:$release" -f Dockerfile .
docker build -t "winx-frontend:$release" -f frontend.Dockerfile .
docker compose -p winx -f compose.yaml up -d --wait --wait-timeout 240 postgres-winx mongo-winx redis-winx kafka-winx
mkdir -p backups
chmod 700 backups
backup="backups/before-$release-$(date -u +%Y%m%dT%H%M%SZ).dump"
(umask 077; docker compose -p winx -f compose.yaml exec -T postgres-winx pg_dump -U winx -d winx-db -Fc > "$backup")
test -s "$backup"
docker compose -p winx -f compose.yaml run --rm migrate
docker compose -p winx -f compose.yaml up -d frontend-winx
docker compose -p winx -f compose.yaml ps
