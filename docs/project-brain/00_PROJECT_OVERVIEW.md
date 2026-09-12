# MYPA Project Brain — Overview

Last updated: 2026-09-12
Review status: SOURCE-LEVEL AUDIT RECONCILED; RUNTIME/DEPLOYED VALIDATION BLOCKED
Scope actually read: the repository audit is recorded through BATCH-0030 with complete enumerated Core/Brain/Food/Shopping/Life-Health/Fitness/Platform/Mobile source scopes, Prisma schema plus 39 migrations, route/controller/DTO/guard and consumer reconciliation, operational recipe scripts, CI/workflows, and canonical findings reconciliation. See `FILE_REVIEW_INDEX.md` and `READING_CHECKPOINTS.md` for batch evidence and boundaries.
Scope not yet read: no known in-scope source gap remains in the recorded audit scope; production/deployed infrastructure, real-device behavior, external service quotas and exact historical PB-001..PB-155 prose remain outside the available environment.
Evidence roots: `apps/backend/src/`; `apps/backend/prisma/`; `apps/backend/test/`; `apps/mobile/`; `.github/workflows/`; `tools/`; `docs/project-brain/`.
Confidence level: HIGH for recorded source-level reads and current remediation evidence; MEDIUM for some cross-module semantic conclusions; LOW only where runtime/deployed evidence is inherently unavailable.
Open questions: production database/RLS/storage state, real-device notification/voice/offline behavior, external provider configuration/quotas, and historical PB-001..PB-155 text recovery.

## Current architecture

The backend is a modular NestJS application with authenticated account foundations plus assistant/brain, food/nutrition/recipes, shopping/inventory/price, life/health, fitness disciplines, intelligence engines, dashboard/command center and content/runtime modules. Evidence: `apps/backend/src/app.module.ts` and the reconciled module catalog.

The mobile app is Expo/React Native with shared authenticated transport, localization/RTL, notifications and voice/TTS contracts, and CI validation for typecheck, source/Jest tests, Expo validation and Android JS bundling. Evidence: `apps/mobile/` and `.github/workflows/mobile-ci.yml`.

The persistence layer is Prisma/PostgreSQL with the schema and 39 migration files reconciled in the audit. Ownership, transaction, index and migration-only concerns are captured in the DB audit artifacts and canonical Appendix.

## Appendix remediation status

The canonical `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` is closed for the currently recoverable source-level finding set through PB-257. Concrete findings were remediated or explicitly reclassified/withdrawn; PB-230 remains a historical-evidence limitation rather than a code defect. Latest Backend and Mobile CI runs on the verified remediation tree are green.

## Engineering boundary

Source audit completion is not equivalent to production readiness or final MYPA product completion. The Vision remains broader than the audited implementation: local/offline AI brain, comprehensive voice actioning, global recommendation depth, camera coaching, health/wearable integrations, subscription enforcement and polished end-to-end mobile journeys remain product work rather than evidence of completion simply because their architectural placeholders or contracts exist.

## Next phase

Continue under the MYPA Master Prompt by using the reconciled Project Brain as the baseline, then prioritize product-completion work by dependency and user journey. Do not reopen already-closed Appendix findings without new evidence.
