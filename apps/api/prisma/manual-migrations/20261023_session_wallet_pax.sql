-- Multi-pax session package orders.
-- Additive only: the previous API image keeps working against this schema,
-- so image rollback stays safe. Safe to run more than once.
BEGIN;

ALTER TABLE "SessionWallet" ADD COLUMN IF NOT EXISTS "participantName" TEXT;
ALTER TABLE "SessionWallet" ADD COLUMN IF NOT EXISTS "orderGroupId" TEXT;
CREATE INDEX IF NOT EXISTS "SessionWallet_orderGroupId_idx" ON "SessionWallet"("orderGroupId");

COMMIT;
