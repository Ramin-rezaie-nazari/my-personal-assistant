# Review Gaps

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: Governance/navigation, operational docs, package manifests, authentication implementation/tests, and substantial source coverage across users/profile/preferences/onboarding/settings/context-engine/device-intelligence/user-intelligence.
Scope not yet read: Remaining files in core scopes, all migrations/schema reconciliation, remaining backend/mobile source, complete CI/test internals, and complete scripts/data inventory.
Evidence roots: `AGENTS.md`; `MYPA_START_HERE.md`; backend operational docs; package manifests; `apps/backend/src/modules/auth/`; `users/`; `profile/`; `preferences/`; `onboarding/`; `settings/`; `context-engine/`; `device-intelligence/`; `user-intelligence/`.
Confidence level: MEDIUM for retrieved implementation, LOW for completeness.
Open questions: exact total source-file count, remaining nested files in core scopes, full schema/migration mapping, route-to-mobile mapping, local Mac dirty/process state.

## Open gaps

1. Complete deterministic repository inventory and per-source-file line counts.
2. Finish `01-core.md` by enumerating and reading every remaining file under auth/users/profile/preferences/onboarding/settings/context-engine/device-intelligence/user-intelligence.
3. Reconcile every Prisma model against migrations and database-facing readers/writers.
4. Build complete backend route catalog and mobile consumer mapping.
5. Complete Brain, food, shopping, life/health and fitness deep reads.
6. Complete mobile source deep read.
7. Verify tests and CI with actual runs where executable; distinguish device-only gates.
8. Reconcile documentation claims against current code where older docs may be stale.
9. Complete security/privacy contract review including auth/session, authorization, secrets, rate limiting and retention.
10. Reassess current recipe/media pipeline separately from historical Supabase-backed media claims; current workflow is local Mac media acquisition and must not be treated as runtime storage evidence.
11. Investigate duplicate users controller paths and duplicated onboarding responsibilities before treating the user/account architecture as coherent.
12. Review currently weak/placeholder core implementations: context snapshot builder, empty context controller, native health bridge placeholders, activity tracker placeholder, user profile intelligence placeholder, and device-sync DTO without validation decorators.

No gap is marked resolved without direct source evidence or executed validation evidence.
