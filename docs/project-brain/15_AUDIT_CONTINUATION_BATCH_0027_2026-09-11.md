# Audit Continuation Batch 0027 — 2026-09-11

Status: IN_PROGRESS — forensic audit only; no production-code remediation.

## Scope

1. Continue the DB reader/writer/relation/index matrix against the current-main Prisma schema.
2. Reconcile query patterns that are not represented by an appropriate composite index.
3. Recheck account-erasure and ownership boundaries without inventing a new finding where an existing canonical issue already covers the root cause.
4. Continue the route/DTO/security matrix using current-main controller evidence.

## DB index findings

### PB-257 — Workout and UserBehavior time-ordered user queries lack matching composite indexes in the final Prisma schema
Status: OPEN — PERFORMANCE/DATA ACCESS
Locations: `apps/backend/prisma/schema.prisma`; `apps/backend/src/modules/workout/services/workout.service.ts`; `apps/backend/src/modules/daily-command-center/daily-command-center.service.ts`; `apps/backend/src/modules/dashboard/dashboard.service.ts`; `apps/backend/src/modules/adaptive-learning/services/adaptive-learning.service.ts`; `apps/backend/src/modules/notifications/services/smart-notification.service.ts`; `apps/backend/src/modules/user-intelligence/services/learning.service.ts`.
Evidence: the final Prisma schema defines `Workout` with `userId` and `performedAt` but no `@@index([userId, performedAt])`. Active services issue user-scoped time-range/order queries such as `where: { userId, performedAt: { gte: startDate, lt: endDate } }, orderBy: { performedAt: 'desc' }` and `where: { userId, performedAt: { gte: todayStart } }, orderBy: { performedAt: 'desc' }`. The final schema likewise defines `UserBehavior` with `userId` and `createdAt` but no user/time composite index, while `LearningService.buildProfile()` performs `where: { userId }, orderBy: { createdAt: 'desc' }, take: 1000`.
Impact: these active user-scoped chronological reads can require broad scans/sorts as per-user history grows, despite being central to Dashboard/Daily Command Center/Adaptive Learning/User Intelligence behavior. This is a schema/index design finding, not a claim of a current production outage; runtime query plans were not available in this audit. The finding should be revalidated against real row counts/query plans before remediation sizing.

## Account-erasure closure recheck

Repository search still finds no `prisma.user.delete`, `deleteUser`, or Supabase Auth admin-delete call in the audited main source. The final Prisma `User` model has broad cascades for modeled user-owned data, but migration-only user-sensitive tables and external Supabase Auth/Storage remain outside that cascade graph. Existing session deletion is user-scoped but is not composed into an authenticated account-delete workflow. PB-254/PB-211 therefore remain the canonical account-erasure closure items; no duplicate finding is created.

## Route/security closure recheck

Current-main controller search confirms the majority of active domain controllers use `JwtAuthGuard`, including Users, Shopping, Inventory, Dashboard, Foods, Meals, Goals, Daily, Habits and the active nested Health controller. The exceptions and intentionally token-based auth routes remain represented by existing findings (Device Intelligence, Price Intelligence, Budget Intelligence, Auth refresh/logout semantics, legacy health/root surfaces). No new generic "controller unguarded" finding is created merely from source presence.

## Historical / duplicate control

PB-252 remains provisional because current-main consumer search still finds the Content Recommendation service only in its own service/module registration; it may be intentional dormant infrastructure, but no active consumer was found. PB-253 remains withdrawn because its prior no-consumer conclusion was disproved by the active Response Planning consumer. PB-250 remains merged into PB-160. PB-251 and PB-256 remain withdrawn; PB-255 remains merged into PB-203.

## Runtime boundary

This batch remains source-level. No production database, deployed Supabase RLS/storage, physical device, or live HTTP runtime was executed in this connector environment. Existing CI run `34613481370` remains the strongest observed runtime/build evidence and is a real frozen-lockfile failure.

## Freeze status

OPEN. Canonical Appendix full-file reconciliation, exhaustive route↔DTO↔test↔mobile mapping, complete DB matrix, PB-252/PB-254 closure, checkpoint/index synchronization, historical catalog handling, and final duplicate-free freeze remain required before any 100% audit claim.
