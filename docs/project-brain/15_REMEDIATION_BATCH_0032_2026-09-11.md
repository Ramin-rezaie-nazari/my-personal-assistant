# Remediation Batch 0032 — User-time query indexes

Date: 2026-09-11
Branch: `audit/project-brain-2026-09-11`

## Completed

PB-257 remediation was applied at the schema/migration layer:
- Added `@@index([userId, performedAt])` to `Workout`.
- Added `@@index([userId, createdAt])` to `UserBehavior`.
- Added migration `20260911123000_add_user_time_indexes` with the matching PostgreSQL indexes.

These indexes directly match the audited user-scoped chronological access patterns.

## Verification boundary

The migration was not executed against a deployed PostgreSQL database in this environment, and production row counts/query plans are unavailable. Therefore this is **remediated at source/migration level; database execution and query-plan verification pending**.
