# MYPA Remediation Execution Plan — 2026-09-11

## Phase boundary

The source-level Master Audit is closed. This document is the controlled handoff into remediation; it does not mark any finding as fixed.

## Execution rules

1. Remediation must be performed in dependency order, not by cosmetic severity alone.
2. Before changing production code, re-read the affected source, schema/migrations, consumers, tests, and current canonical finding.
3. Every remediation batch must add or update regression tests where the repository can support them.
4. No finding is CLOSED until source change + regression evidence + cross-layer contract check are complete.
5. Runtime/device/deployed-environment blockers remain explicitly UNVERIFIED until real evidence exists.
6. Do not merge branch-only experimental fixes into main without revalidation against audited main commit.

## Wave 0 — Baseline blockers and reproducibility

- PB-242: frozen-lockfile / lockfile reproducibility failure.
- PB-206: recipe-content release workflow references unavailable package scripts.
- PB-246: mobile CI does not execute committed mobile tests.
- PB-244: incomplete backend environment example/config contract.

Exit condition: CI/package entrypoints are internally consistent and the intended test gates are executable from a clean checkout.

## Wave 1 — Authentication and security correctness

- PB-172/PB-187/PB-208/PB-209: refresh lifetime, persisted session expiry, rotation/reuse, and security controls.
- PB-171: Fitness controller identity/ownership contract.
- PB-186: Brain Integration mobile/backend route mismatch.
- PB-211/PB-254: account-erasure/retention workflow, including migration-only and external Auth/Storage boundaries.
- Existing authorization/ownership findings from the canonical Appendix.

Exit condition: authenticated identity shape, ownership, refresh lifecycle, destructive paths, retention and deletion semantics are coherent and regression-tested.

## Wave 2 — Data integrity and transactional correctness

- PB-160: LifeTask completion timestamp semantics.
- PB-233/PB-234 and other concrete class-DTO validation findings.
- PB-235: Goal check-in atomicity.
- PB-241: Shopping recipe-missing batch transactionality.
- Existing raw-SQL/migration-only contract findings.

Exit condition: coupled writes are atomic, DTO contracts match global validation semantics, and migration-only persistence has explicit reader/writer ownership.

## Wave 3 — Timezone and temporal semantics

- PB-247: Smart Planning server-local time.
- PB-221 and all already identified UTC/server-local user-day findings across Dashboard, Daily, Habits, Nutrition, Goals, Workout, Adaptive Learning, Personal Brain and notifications.

Exit condition: user-facing calendar/day semantics derive from persisted user timezone and tests cover timezone boundaries.

## Wave 4 — Architecture/runtime wiring

- LifeTasks vs LifeExecution parallel-domain decision.
- PB-161/PB-162: Recommendation Intelligence runtime wiring.
- PB-164/PB-165/PB-166: Goal Intelligence runtime wiring.
- PB-248: empty Context Engine controller artifact.
- PB-249: public Hello World starter endpoint.
- PB-252: ContentRecommendationService dormant-provider decision.
- Remaining orphan/duplicate source findings from the canonical Appendix.

Exit condition: every retained production module has an explicit runtime role and every removed/deprecated surface has an intentional contract.

## Wave 5 — Performance and operational reliability

- PB-257: Workout/UserBehavior composite index sizing after runtime query-plan/row-count evidence.
- Recipe image pipeline findings PB-194/PB-196/PB-203 and related operational findings.
- Recipe intelligence PB-199/PB-200/PB-204.
- Remaining restartability, checkpointing, pagination, idempotency and destructive-script findings.

Exit condition: operational scripts have canonical entrypoints, safe restart semantics, bounded work, and explicit failure recovery.

## Wave 6 — Mobile quality and UX contracts

- PB-205 auth transport duplication/refresh behavior.
- PB-215/PB-216 localization/RTL gaps.
- PB-217 hook-order correctness.
- PB-180/PB-181/PB-185 voice/TTS dependency and integrity gaps.
- Mobile onboarding/local persistence, typed routes, test coverage, notification runtime and other canonical mobile findings.

Exit condition: mobile contracts match backend APIs, authentication is centralized, localization/RTL is intentional, and mobile tests are part of CI.

## Final validation gate

Only after Waves 0–6:

- run backend unit/E2E/CI;
- run mobile tests/typecheck/config/export;
- run DB migration/schema checks;
- validate deployed DB/RLS/Storage/Auth where credentials are available;
- validate physical-device notification/voice flows;
- re-run the canonical findings catalog;
- close findings individually with evidence;
- update `15_AUDIT_FINDINGS_APPENDIX.md`, `12_OPEN_WORK.md`, `READING_CHECKPOINTS.md`, `FILE_REVIEW_INDEX.md`, `REVIEW_GAPS.md`, and the validation ledger.

A project-level 100% claim is forbidden until the final validation gate is evidenced. The audit's 100% closure is not a production-readiness claim.
