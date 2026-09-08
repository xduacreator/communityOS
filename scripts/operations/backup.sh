#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")/../.."
# Deployment and the timer share this lock, so checkout/build cannot race a backup.
exec 9>/var/lock/community-os-operations.lock
flock -w 1800 9
docker compose run --rm --no-deps backup
