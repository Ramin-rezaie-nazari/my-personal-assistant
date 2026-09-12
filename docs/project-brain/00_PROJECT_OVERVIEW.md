# MYPA Project Brain — Overview

Last updated: 2026-09-12
Review status: SOURCE-LEVEL AUDIT RECONCILED; MASTER PROMPT DEVELOPMENT IN PROGRESS; RUNTIME/DEPLOYED VALIDATION BLOCKED
Scope actually read: the repository audit is recorded through BATCH-0030 with complete enumerated Core/Brain/Food/Shopping/Life-Health/Fitness/Platform/Mobile source scopes, Prisma schema plus 39 migrations, route/controller/DTO/guard and consumer reconciliation, operational recipe scripts, CI/workflows, canonical findings reconciliation, and focused Inventory → Shopping unit semantics.
Scope not yet read: no known in-scope source gap remains in the recorded audit scope; production/deployed infrastructure, real-device behavior, external service quotas and exact historical PB-001..PB-155 prose remain outside the available environment.
Evidence roots: `apps/backend/src/`; `apps/backend/prisma/`; `apps/backend/test/`; `apps/mobile/`; `.github/workflows/`; `tools/`; `docs/project-brain/`.
Confidence level: HIGH for recorded source-level reads and current remediation evidence; MEDIUM for some cross-module semantic conclusions; LOW only where runtime/deployed evidence is inherently unavailable.
Open questions: production database/RLS/storage state, real-device notification/voice/offline behavior, external provider configuration/quotas, and historical PB-001..PB-155 text recovery.

## Current architecture

The backend is a modular NestJS application with authenticated account foundations plus assistant/brain, food/nutrition/recipes, shopping/inventory/price, life/health, fitness disciplines, intelligence engines, dashboard/command center and content/runtime modules. Evidence: `apps/backend/src/app.module.ts` and the reconciled module catalog.

The mobile app is Expo/React Native with shared authenticated transport, localization/RTL, notifications and voice/TTS contracts, and CI validation for typecheck, source/Jest tests, Expo validation and Android JS bundling. Evidence: `apps/mobile/` and `.github/workflows/mobile-ci.yml`.

The persistence layer is Prisma/PostgreSQL with the schema and 39 migration files reconciled in the audit. Ownership, transaction, index and migration-only concerns are captured in the DB audit artifacts and canonical Appendix.

## Appendix remediation status

The canonical `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` is reconciled through PB-270. PB-270 covers an Inventory/Recipe → Shopping unit-integrity defect that was remediated with compatible-unit conversion and fail-closed rejection of incompatible units; Backend CI `34691080753` and Mobile CI `34691080764` are green on the verified tree `1f3f73601183779fbef865a82ce2ea3dee3f8c33`. PB-230 remains a historical-evidence limitation rather than a code defect.

## Engineering boundary

Source audit completion is not equivalent to production readiness or final MYPA product completion. The Vision remains broader than the audited implementation: local/offline AI brain, comprehensive voice actioning, global recommendation depth, camera coaching, health/wearable integrations, subscription enforcement and polished end-to-end mobile journeys remain product work rather than evidence of completion simply because their architectural placeholders or contracts exist.

## Current Master Prompt phase

MASTER-0004 is in progress. The deterministic Recipe → Inventory gap → Price Evidence → Budget → Shopping journey is substantially implemented and CI-verified. The next focused work is Pantry/Inventory ↔ Shopping lifecycle reconciliation, followed by broader price-source coverage and remaining stale Budget/Shopping artifact audit.

## Next phase

Continue under the MYPA Master Prompt using the reconciled Project Brain as the baseline. Do not reopen already-closed Appendix findings without new evidence; new concrete defects discovered during focused vertical reconciliation must be added to the canonical Appendix.
