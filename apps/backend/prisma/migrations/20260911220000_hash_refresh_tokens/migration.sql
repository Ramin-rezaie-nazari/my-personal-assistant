-- Refresh tokens were previously stored in plaintext. Existing sessions are
-- intentionally revoked during this security migration because their plaintext
-- values cannot be safely transformed into the new hash representation without
-- exposing them to application code or relying on non-equivalent password KDFs.
DELETE FROM "Session";

ALTER TABLE "Session"
  DROP COLUMN "refreshToken",
  ADD COLUMN "refreshTokenHash" TEXT NOT NULL;

CREATE UNIQUE INDEX "Session_refreshTokenHash_key"
  ON "Session"("refreshTokenHash");
