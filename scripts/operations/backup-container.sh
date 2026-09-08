#!/bin/sh
set -eu
umask 077

# The only persistent writable mount is /backups. Uploads are mounted read-only.
mkdir -p /backups
chmod 700 /backups
snapshot=$(mktemp -d "/backups/$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX")
echo "Creating backup $(basename "$snapshot")"
pg_dump --format=custom --no-owner --no-acl --file="$snapshot/database.dump"
tar -czf "$snapshot/uploads.tar.gz" -C /uploads .
cd "$snapshot"
sha256sum database.dump uploads.tar.gz > SHA256SUMS
sh /operations/restore-check.sh "$snapshot"
date -u +%Y-%m-%dT%H:%M:%SZ > VERIFIED
echo "Backup verified: $(basename "$snapshot")"

# Retain successful local backups for at least 14 days. Incomplete backups are
# preserved for investigation; only these four known files are ever removed.
find /backups -mindepth 1 -maxdepth 1 -type d -mtime +14 | while IFS= read -r old; do
  basename "$old" | grep -Eq '^[0-9]{8}T[0-9]{6}Z-[A-Za-z0-9]{6}$' || continue
  test -f "$old/VERIFIED" || continue
  rm -f -- "$old/database.dump" "$old/uploads.tar.gz" "$old/SHA256SUMS" "$old/VERIFIED"
  rmdir "$old"
done
