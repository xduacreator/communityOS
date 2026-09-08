#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")/../.."
project="latih-backup-test-${GITHUB_RUN_ID:-local}-$$"
compose=(docker compose -p "$project" -f .github/compose.operations-test.yml)
# Only ephemeral fixture containers/volumes belonging to this unique test project.
trap '"${compose[@]}" down --volumes' EXIT
"${compose[@]}" up -d --wait --wait-timeout 90 db
"${compose[@]}" exec -T db psql -U postgres -v ON_ERROR_STOP=1 -c \
  "CREATE TABLE backup_fixture(id integer PRIMARY KEY, value text); INSERT INTO backup_fixture VALUES(1, 'restore-test');"
"${compose[@]}" exec -T db sh -c 'printf "%s\n" upload-fixture > /uploads/fixture.txt'
"${compose[@]}" run --rm --no-deps backup
"${compose[@]}" run --rm --no-deps --entrypoint sh backup -c '
  set -eu
  snapshot=$(find /backups -name VERIFIED | head -1 | xargs dirname)
  test -f "$snapshot/VERIFIED"
  tar -xOzf "$snapshot/uploads.tar.gz" ./fixture.txt | grep -qx upload-fixture
  # A corrupt dump with freshly recomputed checksums must fail the actual restore.
  printf "%s\n" corrupt > "$snapshot/database.dump"
  cd "$snapshot"
  sha256sum database.dump uploads.tar.gz > SHA256SUMS
  if sh /operations/restore-check.sh "$snapshot"; then
    echo "ERROR: corrupt database was accepted"; exit 1
  fi
'
# A missing database must fail backup instead of marking a snapshot verified.
if "${compose[@]}" run --rm --no-deps -e PGDATABASE=does_not_exist backup; then
  echo 'ERROR: backup unexpectedly accepted missing database'; exit 1
fi
# Restore tests must leave the source database untouched.
"${compose[@]}" exec -T db psql -U postgres -At -c 'SELECT value FROM backup_fixture WHERE id=1' | grep -qx restore-test
