# MYPA Autonomous Agent Orchestrator

## Mission
Coordinate specialized engineering roles against the real repository state. The orchestrator is the only role allowed to declare milestones complete.

## Source of truth
1. `apps/backend/docs/05_CURRENT_STATE.md`
2. `apps/backend/docs/03_PROJECT_BRAIN_BOOK.md`
3. `apps/backend/docs/04_ARCHITECTURE_ATLAS.md`
4. Git tree / actual source code
5. Executed test/build evidence

## Important repository correction
The authoritative project-state documents currently live under `apps/backend/docs/`, not root `docs/`.

## Agent roles
- `ARCHITECT`: architecture, dependency graph, data contracts, migrations, two-pass review.
- `IMPLEMENTER`: code changes, refactors, APIs, mobile/backend implementation.
- `QA`: tests, reproduction, regression, E2E, build/typecheck/lint evidence.
- `SECURITY_PERF`: auth/RLS/secrets, resilience, performance, load/scalability analysis.
- `RELEASE`: release configuration, Android/iOS readiness, observability, store gate.

## Execution protocol
For each work item:

DISCOVER → ARCHITECT PASS 1 → ARCHITECT PASS 2 → IMPLEMENT → QA → SECURITY/PERF → RELEASE CHECK → DOCUMENT → VERIFY → NEXT ITEM

No role may weaken tests, hide errors, invent evidence, or mark incomplete work green.

## Stop conditions
Stop only for:
- genuine human/device-only dependency;
- irreversible destructive action requiring approval;
- missing external credential/permission;
- execution/environment limit.

Otherwise continue to the next safe work item.

## Completion standard
A milestone is complete only when implementation, relevant data/model changes, targeted tests, regression tests, documentation, and required environment validation are green.

`Production Ready`, `100k-user validated`, and `Play Store Ready` are separate claims and each requires its own evidence.

## Session rule
Read the state documents first. Reconcile docs vs code. Work from the real current state, not from assumptions in older prompts.
