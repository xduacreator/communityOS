#!/bin/sh
set -eu
umask 077
snapshot=${1:?Expected a backup directory under /backups}
case "$snapshot" in /backups/*) ;; *) exit 1 ;; esac
cd "$snapshot"
sha256sum -c SHA256SUMS
# Never use inherited production connection settings during restore.
unset PGPASSWORD PGHOST PGUSER PGDATABASE PGPORT PGSERVICE PGSERVICEFILE
drill=$(mktemp -d /tmp/latih-restore-XXXXXX)
chown postgres:postgres "$drill"
cleanup() {
  su-exec postgres pg_ctl -D "$drill/data" -m immediate -w stop >/dev/null 2>&1 || true
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM
su-exec postgres initdb -D "$drill/data" -A trust --no-locale >/dev/null
su-exec postgres pg_ctl -D "$drill/data" -l "$drill/server.log" \
  -o "-k $drill -c listen_addresses=''" -w start >/dev/null
createdb -h "$drill" -U postgres restore_test
pg_restore --exit-on-error --single-transaction --no-owner --no-acl \
  -h "$drill" -U postgres -d restore_test "$snapshot/database.dump"
table_count=$(psql -X -h "$drill" -U postgres -d restore_test -At -v ON_ERROR_STOP=1 \
  -c "SELECT count(*) FROM pg_tables WHERE schemaname='public'")
test "$table_count" -gt 0
mkdir "$drill/uploads"
tar -xzf "$snapshot/uploads.tar.gz" -C "$drill/uploads"
echo "Restore check passed: $table_count tables; uploads extracted into temporary container storage."
