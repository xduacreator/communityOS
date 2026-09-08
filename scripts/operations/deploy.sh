#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
cd "$(dirname "$0")/../.."
release=${1:?Expected the verified GitHub commit SHA}
[[ "$release" =~ ^[0-9a-f]{40}$ ]] || exit 1
[[ "$(git rev-parse HEAD)" == "$release" ]] || { echo 'Checkout does not match verified commit'; exit 1; }
command -v flock >/dev/null
command -v curl >/dev/null
command -v systemctl >/dev/null
docker compose up --help | grep -q -- '--wait-timeout'

# Caller holds the shared operations lock before updating this checkout.
previous_api=$(docker inspect --format '{{.Image}}' community-os-api)
previous_web=$(docker inspect --format '{{.Image}}' community-os-web)
docker image tag "$previous_api" "community-os-api:rollback-$release"
docker image tag "$previous_web" "community-os-web:rollback-$release"
export API_IMAGE="community-os-api:$release"
export WEB_IMAGE="community-os-web:$release"

# Automatic image rollback is only safe for a schema-compatible release. Reject
# schema changes for a separate reviewed migration; startup no longer runs db push.
running_schema=$(docker exec community-os-api cat /app/apps/api/prisma/schema.prisma | sha256sum | cut -d' ' -f1)
target_schema=$(sha256sum apps/api/prisma/schema.prisma | cut -d' ' -f1)
[[ "$running_schema" == "$target_schema" ]] || {
  echo 'Schema change detected. A reviewed migration and recovery plan are required.'
  exit 1
}

docker compose build api web
docker compose run --rm --no-deps backup

restore_images() {
  result=$?
  trap - ERR
  echo 'Deployment failed; restoring previous application images.'
  export API_IMAGE="community-os-api:rollback-$release"
  export WEB_IMAGE="community-os-web:rollback-$release"
  # Older images ran db push at startup; explicitly bypass that during rollback.
  override=$(mktemp /tmp/latih-rollback-XXXXXX.json)
  printf '%s\n' '{"services":{"api":{"command":["node","dist/main.js"],"healthcheck":{"test":["CMD","node","-e","fetch(\"http://127.0.0.1:3001/api\").then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]}}}}' > "$override"
  if docker compose -f docker-compose.yml -f "$override" up -d --no-build --no-deps --wait --wait-timeout 180 api web &&
    docker compose up -d --no-deps --force-recreate nginx; then
    echo 'Previous application images restarted. Database and uploads were not restored.'
  else
    echo 'ROLLBACK FAILED: operator intervention is required.'
  fi
  rm -f "$override"
  exit "$result"
}
trap restore_images ERR
# Do not recreate the database as part of an application release.
docker compose up -d --no-build --no-deps --wait --wait-timeout 180 api web
# Refresh nginx DNS after application container addresses may have changed.
docker compose up -d --no-deps --force-recreate nginx
for endpoint in http://127.0.0.1/api/health http://127.0.0.1/login; do
  code=$(curl --fail --silent --show-error --retry 6 --retry-all-errors --retry-delay 5 --max-time 10 \
    --output /dev/null --write-out '%{http_code}' "$endpoint")
  [[ "$code" == 200 ]] || { echo "Health check did not return HTTP 200: $endpoint"; false; }
done
trap - ERR

install -m 644 scripts/operations/community-os-backup.service /etc/systemd/system/community-os-backup.service
install -m 644 scripts/operations/community-os-backup.timer /etc/systemd/system/community-os-backup.timer
systemctl daemon-reload
systemctl enable --now community-os-backup.timer
systemctl is-active community-os-backup.timer
echo "Deployment healthy: $release. Daily local backup enabled; offsite storage is not configured."
