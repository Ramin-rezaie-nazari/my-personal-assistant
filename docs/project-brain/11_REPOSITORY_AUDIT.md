# Repository Audit

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: repository metadata/baseline manifests; complete identified Core/Auth source; AppModule wiring; complete Prisma schema + all 39 migrations; enumerated Assistant/Brain/Food/Recipe/Nutrition/Meals/Shopping/Inventory/Price/Life/Health/Fitness/Platform/Test/CI scopes; substantial Mobile app/lib/routes/components/native/API clients; backend common/config/auth/fitness cross-contracts; package-wired and legacy operational recipe/food/image scripts; relevant release workflows; selected historical PR/branch metadata and patches; current Project Brain documents and findings appendix.
Scope not yet read: remaining repository source outside closed enumerations; exhaustive route↔DTO↔test↔mobile mapping; exhaustive database reader/writer/transaction/relation/index mapping; full security/privacy retention and deletion proof; full runtime validation; physical-device validation; complete historical branch/doc reconciliation; remaining legacy/duplicate operational scripts.
Evidence roots: repository `Ramin-rezaie-nazari/my-personal-assistant`, current-main baseline `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`, audit branch `audit/project-brain-2026-09-11`, `apps/backend/`, `apps/mobile/`, `.github/workflows/`, `docs/project-brain/`.
Confidence level: HIGH for completed file-level observations; MEDIUM for cross-module conclusions; runtime/deployment state remains unverified.

## Environment limitation

No local repository clone is available in this runtime. A safe clone attempt could not resolve `github.com`; therefore local dirty/untracked state, local dependency installation, live database contents, user-machine background processes, and physical-device behavior cannot be honestly verified. The audit uses GitHub repository/branch/file/PR evidence only for source-level review.

## Current audit governance

- Audit changes are documentation-only on `audit/project-brain-2026-09-11`.
- No production-code modification has been made by this audit branch work.
- `docs/05_CURRENT_STATE.md` is the root canonical audit-state path required by the protocol; `apps/backend/docs/05_CURRENT_STATE.md` remains a legacy/operational document until deliberate reconciliation.
- All newly discovered issues are required to be recorded in `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` with exact location, evidence and impact.
- Remediation is intentionally deferred until the Master Prompt audit scope is fully closed, except for immediate containment if a newly established safety-critical condition requires it.

## Verified repository facts

Default branch is `main`; audit work is performed against `audit/project-brain-2026-09-11` so current-main production behavior is not altered during the audit.

`apps/backend/src/app.module.ts` currently imports the active core/domain modules including Auth, Users, Profile, Onboarding, Assistant, Food/Recipe/Nutrition/Meals, Shopping/Inventory, LifeExecution, Fitness/Yoga/Calisthenics, Brain/Decision/Adaptive/Context, Dashboard/Daily Command Center, Price/Shopping/Budget Intelligence and Content. Earlier orphan assertions for `ContentModule` were corrected to NOT_APPLICABLE.

Known source-present but not active in `AppModule` remain documented separately, notably LifeTasks, RecommendationIntelligence and GoalIntelligence; exact module/runtime evidence is retained in the findings appendix and contract/open-work documents.

## Major current audit findings

- Auth lifecycle: persisted refresh-session lifetime differs from configurable JWT lifetime; refresh rotation does not revoke the previous session; refresh tokens are persisted in plaintext; stored session expiry is not enforced in the refresh-token lookup path.
- Mobile auth: access/refresh tokens are persisted in AsyncStorage, and several domain API clients bypass the canonical 401→refresh→retry behavior.
- Backend↔Mobile: onboarding completion is local-only and does not synchronize the authenticated backend onboarding/profile state; Mobile `getBrainContext()` targets an unexposed backend route.
- Recipe/food operational layer: content importer/schema drift, non-restartable first-batch behavior, non-transactional related writes, image contract drift, destructive image reset behavior, broken v8 image orchestration and country preference scorer/query mismatch remain open.
- CI/release: recipe content release workflow references undefined backend package scripts.
- Data quality: recipe quality-score unit mismatch and nutrition-estimation provenance gap remain open.

## Historical workstream status

High-value branches and PRs are not treated as merged production behavior without explicit merge evidence. PR #48 is open/unmergeable, PR #49 is open/mergeable only against its feature base, PR #66 is draft/branch-scoped, and PR #60 is a draft validation branch. Their patches are evidence for historical divergence only until merged.

## Next closure gates

1. Exhaustive repository-wide route↔DTO↔test↔mobile consumer mapping.
2. Exhaustive database reader/writer/transaction/relation/index reconciliation.
3. Full security/privacy authorization, retention, deletion and deployment-boundary review.
4. Remaining common/platform/test/legacy operational source closure.
5. Complete historical branch/PR and documentation reconciliation.
6. Runtime/test/device validation ledger where execution is actually possible.
7. Freeze the canonical findings catalog only after the preceding gates are complete; then begin separate remediation.
