# Deployment and recovery

Production lives in `/root/communityOS`. GitHub Actions verifies the exact commit,
serializes deployment, and shares `/var/lock/community-os-operations.lock` with the
backup timer. Tracked server edits or a non-fast-forward checkout stop deployment.

Before replacing API/web containers, deployment builds tagged images, preserves
the currently running image IDs as rollback tags, and completes a database/upload
backup with an isolated restore test. `/api/health` checks the database and returns
503 on failure. Docker waits for API/web readiness, nginx is recreated to refresh
upstream DNS, and local HTTP checks verify routing. The database is not recreated.
Failure after replacement restores the previous API/web images and leaves the
workflow red. A failed backup or build stops before replacement.

The API no longer runs `prisma db push` at startup. This deployment path rejects
changes to the schema embedded in the running API image. Schema releases require
a separately reviewed migration and recovery plan. Image rollback does not undo
database changes or restore old data. The first rollback can use `/api` readiness
for an older image that predates `/api/health`.

Use the GitHub deployment workflow for releases. Avoid bare `docker compose up`
on production: release image tags are supplied by the deployment script. Previously
tagged images are retained; review disk usage before deliberately pruning old ones.

## Local backup

`community-os-backup.timer` runs daily at 03:00 Asia/Jakarta with up to five minutes
of jitter. Missed schedules run after restart. Each backup contains a PostgreSQL
custom-format dump, an upload archive, SHA-256 checksums and a `VERIFIED` marker
written only after database restore and upload extraction succeed. Successful
snapshots are retained for at least 14 days under `/var/backups/community-os`
(root-only permissions). Failed snapshots remain for investigation.

The restore test starts a new PostgreSQL cluster inside the short-lived backup
container using a private Unix socket and clears production connection variables.
It restores all data with `--exit-on-error --single-transaction`, checks that public
tables exist, and extracts uploads to temporary storage. It never writes to the
production database or upload volume. Daily backups are online: the DB dump is
transactionally consistent; DB and upload files are not one atomic snapshot.

Useful server commands:

```sh
systemctl list-timers community-os-backup.timer
systemctl status community-os-backup.service
journalctl -u community-os-backup.service --since yesterday
sudo bash /root/communityOS/scripts/operations/backup.sh
sudo du -sh /var/backups/community-os
```

To retest an existing snapshot without replacing production data:

```sh
cd /root/communityOS
docker compose run --rm --no-deps --entrypoint sh backup \
  /operations/restore-check.sh /backups/REPLACE_WITH_SNAPSHOT_DIRECTORY
```

For actual disaster recovery, first provision a separate PostgreSQL 16 instance
and empty upload volume. Check `SHA256SUMS`, restore `database.dump` with
`pg_restore --exit-on-error --single-transaction --no-owner --no-acl` into that new
database, and extract `uploads.tar.gz` into the empty upload volume. Verify member,
payment, attendance and upload data before switching traffic. Do not run a restore
against the existing production database without an explicit recovery decision.

## Remaining infrastructure setup

**Offsite backup is not configured.** Local snapshots do not protect against loss
of the VPS/disk or a compromised root account. A separate storage destination and
credentials are needed before adding encrypted offsite copying and remote restore
verification. No backup data is uploaded to GitHub artifacts. Database passwords,
JWT secrets and server configuration need a separate secure recovery copy.

Backup failures are visible in systemd/journald; external alerts are not configured.
Monitor free disk space: failed snapshots and retained rollback images are not
automatically pruned. Docker integration tests run on GitHub's isolated runner with
fixture data, including corrupt-dump and unavailable-database failure cases.
