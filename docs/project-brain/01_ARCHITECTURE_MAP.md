# Architecture Map

Last updated: 2026-09-12
Review status: SOURCE-LEVEL AUDIT RECONCILED; RUNTIME/DEPLOYED VALIDATION BLOCKED
Scope actually read: backend root/module wiring, Core plus Brain/Food/Shopping/Life-Health/Fitness/Platform source scopes, Prisma schema/migrations, CI/workflows, mobile routes/clients/components/native/library contracts, route/DTO/guard/consumer reconciliation and operational script surfaces, as recorded in `FILE_REVIEW_INDEX.md` and `READING_CHECKPOINTS.md` through BATCH-0030.
Scope not yet read: no known in-scope source scope remains unreviewed in the recorded audit. Environmental runtime/deployed infrastructure and physical-device behavior remain outside the available environment.
Evidence roots: `apps/backend/src/app.module.ts`; `apps/backend/src/modules/`; `apps/backend/prisma/`; `apps/mobile/`; `.github/workflows/`; `docs/project-brain/FILE_REVIEW_INDEX.md`.
Confidence level: HIGH for recorded source-level topology; MEDIUM for some dynamic/runtime relationships that require deployment execution.
Open questions: production-only integrations, live database/RLS state, real device behavior and external provider configuration.

## Backend root

`AppModule` is the primary runtime composition root and connects authentication, user/account foundations, assistant/brain, food/nutrition/recipes, shopping/inventory/price, life/health, fitness, intelligence, dashboards/command-center and content modules. Runtime registration and retired orphan/placeholder artifacts are reconciled in the canonical Appendix.

## Cross-domain dependency shape

Authentication owns credential/session issuance and refresh rotation and is consumed by authenticated domain controllers. Session state is persisted through Prisma; refresh tokens are stored as hashes and expiry is enforced by the session service.

LifeTasks is the canonical task domain for active task execution; historical parallel LifeExecution artifacts were retired or reconciled. Goal Intelligence, Recommendation Intelligence and other decision services are runtime-mounted rather than left as disconnected providers.

Food/recipe intelligence is backed by canonical Prisma recipe structures, transactional/restartable import paths, image pagination/reset safety and recommendation/nutrition provenance contracts. Shopping/Inventory consumes user-scoped food/recipe data and transactional basket-generation paths. Price intelligence preserves source-native currency rather than assuming a single locale.

Time-sensitive domains propagate persisted user timezone into date-window and scheduling semantics. Mobile domain clients use shared authenticated transport, with localization/RTL and notification lifecycle integrated into active application paths.

## Database topology

Prisma is the canonical application data contract. The audit compared `schema.prisma` with all recorded migration SQL files and reconciled ownership, relations, indexes and transaction boundaries. Composite indexes relevant to workout and behavior lookup are present in the reconciled schema.

## Mobile topology

The mobile layer consumes backend contracts through a shared authenticated transport. Audited routes and command-center surfaces use the common localization/RTL layer; notification startup/action handling and voice/TTS consumer paths are active. CI validates type safety, mobile tests, Expo configuration and Android JS bundle generation.

## Architecture boundary

This map describes verified source topology, not a claim that every future MYPA Vision capability already exists. The global local/offline AI brain, advanced voice orchestration, camera coaching, broad wearable integrations, comprehensive pricing providers and fully polished mobile product journeys remain future implementation layers.
