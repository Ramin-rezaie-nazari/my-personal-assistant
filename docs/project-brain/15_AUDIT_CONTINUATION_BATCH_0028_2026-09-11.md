# Audit Continuation Batch 0028 — 2026-09-11

Status: IN_PROGRESS — forensic audit only; no production-code remediation.

## Scope

1. Continue exhaustive route↔DTO↔test↔mobile contract reconciliation from the current-main controller and mobile-client surfaces.
2. Reconcile inline `@Body()` contracts versus class DTOs under the global ValidationPipe without repeating the already-corrected PB-232/PB-237 claims.
3. Revalidate runtime module wiring for Recommendation Intelligence and Goal Intelligence.
4. Reconcile mobile transport implementations and identify only genuinely distinct consumer/contract gaps.
5. Preserve historical finding IDs and avoid duplicate umbrella findings.

## Route↔DTO↔mobile findings / controls

### Existing finding families reconfirmed — no duplicate IDs

- Shopping write bodies are inline object contracts and remain covered by PB-054; the active controller is JWT guarded and passes `req.user.id` to the service. This pass does not reclassify the inline object as a guaranteed ValidationPipe whitelist collision.
- Fitness write body remains an inline `{ profile: FitnessProfile }` contract and the authenticated identity-shape issue remains PB-171; no new DTO finding is created because PB-089 already covers the broader Fitness write validation surface.
- Calendar PATCH remains inline and CreateCalendarEventDto remains the concrete class-DTO validation surface; PB-234 stays narrowed as previously documented.
- Memory Intelligence and User Intelligence inline bodies are not reclassified as guaranteed whitelist collisions; PB-232/PB-237 correction notes remain authoritative.
- Recipes PATCH uses `Partial<CreateRecipeDto>` at the TypeScript type level. Because the mapped type does not provide runtime validation metadata, this is a validation/type-contract weakness, but it overlaps the existing recipe API contract findings and is not promoted to a new ID without independent runtime evidence.
- Assistant confirmation, Personal Brain decision confirmation, Yoga/Calisthenics session bodies and Price Intelligence preview bodies were directly observed as inline object contracts. They are treated as API type-safety/validation debt only where an existing finding already covers the domain; no duplicate generic "all inline bodies are broken" finding is created.

## Auth/transport consumer reconciliation

Current-main mobile API implementations are not uniform:

- `apps/mobile/lib/api.ts` has the canonical stored-token/refresh infrastructure.
- `calendar-api.ts`, `price-api.ts`, and `brain-execution.ts` contain explicit refresh/retry logic.
- `recipe-api.ts`, `shopping-api.ts`, `shopping-basket-api.ts`, `inventory-api.ts`, and `assistant-api.ts` independently construct requests and do not implement the same 401 refresh/retry path. This directly reconfirms PB-205.
- AsyncStorage access-token/refresh-token persistence in `api.ts` remains PB-182; duplicate request helpers do not create a separate token-storage finding.

## Runtime module wiring revalidation

- `RecommendationIntelligenceController` is still an empty `@Controller('recommendation-intelligence')` artifact, and `RecommendationIntelligenceModule` is not found in the active AppModule import graph. PB-161/PB-162 remain canonical.
- `GoalIntelligenceController` is still an empty `@Controller('goal-intelligence')` artifact, and `GoalIntelligenceModule` is not found in the active AppModule import graph. PB-164/PB-165/PB-166 remain canonical.
- `ContentModule` remains active in AppModule, while `ContentRecommendationService` still has no repository-wide production consumer beyond module registration. PB-252 remains provisional and is not promoted to a duplicate module-orphan finding.
- `ConversationStyleService` remains consumed by the active Response Planning path; PB-253 stays withdrawn.

## Mobile route consumer reconciliation

Confirmed current-main consumers include:

- Meals → `/meals` and `/nutrition/summary`.
- Smart Meals → `/foods`, `/nutrition/summary`, inventory data.
- Meal Builder → `/foods`.
- Calendar → `/calendar`.
- Reminders → `/reminders`.
- Notifications → `/notifications`.
- Habits → `/habits` and habit summary.
- Insights → `/adaptive-learning/insights`.
- Command Center → Daily Command Center, Personal Brain plan history/decision trace, nutrition summary.
- Shopping/Inventory/Recipe API clients → their corresponding domain routes, with PB-205 auth transport inconsistency.

No new stale mobile endpoint was established beyond PB-186 (`/brain-integration/context`).

## Test-mapping evidence

Repository-wide test search confirms active tests exist across Core/common, Food, Goals, Daily, Health, Fitness, Yoga, notification contracts and mobile branding/notification surfaces. The absence of a package/CI mobile test runner remains PB-246, while typecheck exclusion remains PB-179/PB-152. No new finding is created solely because a controller lacks a direct spec; existing module-specific test-gap findings are retained where already canonical.

## Validation conclusion for this batch

The route↔DTO↔test↔mobile matrix is materially expanded, but it is not yet legitimately marked exhaustive: the repository contains enough controllers, DTOs, tests and mobile helpers that a complete endpoint-by-endpoint ledger still requires the remaining backend controllers and exact mobile consumers to be reconciled. Runtime HTTP execution remains unavailable in this connector environment.

## Freeze impact

No production source changed. No new canonical finding ID was created in this batch. Existing canonical families reconfirmed: PB-054, PB-089, PB-171, PB-182, PB-186, PB-205, PB-234, PB-246, PB-252, PB-253 (withdrawn), PB-161/PB-162, PB-164/PB-165/PB-166.

The audit remains OPEN pending complete route/DTO/test/mobile closure, DB matrix closure, security/privacy/account-erasure closure, canonical Appendix merge, historical catalog reconciliation, and final duplicate-free freeze.