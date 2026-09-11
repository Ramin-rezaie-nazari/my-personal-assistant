# Audit Continuation Batch 0026 — 2026-09-11

Status: IN_PROGRESS — forensic audit only; no production-code remediation.

## Scope

1. Revalidate previously provisional recipe-intelligence and operational-script findings directly against audited main commit `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`.
2. Reconcile current Prisma `User` ownership/cascade surface for account-erasure closure.
3. Reconcile canonical-vs-historical finding IDs before Appendix freeze.

## Results

### Recipe intelligence current-main verification

`apps/backend/scripts/recipe-recommendation-score.mjs` exists on audited main. PB-199 remains active: the script divides a positive stored `quality_score` by 100 before clamping, while the ingest path stores a fractional bounded score. PB-204 also remains active: `globalCultureFit()` expects `iso2`, `country`, and `region` on relation rows, while the relation query selects only `recipe_id,country_id,relation_type,confidence,evidence`.

`apps/backend/scripts/recipe-nutrition-estimate.mjs` exists on audited main. PB-200 remains independently active: the estimator uses a hard-coded FOOD nutrient table and hard-coded quantity conversions without a persisted source/provenance contract for those nutrient constants. Its presence is not grounds for withdrawal.

Therefore PB-199/PB-200/PB-204 are not missing-file findings and must remain separate from withdrawn PB-251/PB-256.

### Operational-script revalidation

Direct current-main checks establish:
- `recipe-image-reprocess-retry.mjs` exists at the package-declared retry-quality path; PB-251 is withdrawn.
- `recipe-images-local-guaranteed-v7.mjs` exists.
- `recipe-images-local-guaranteed-v8.mjs` references missing `recipe-images-local-strict-v3.mjs`, `recipe-images-local-gallery-upgrade-v1.mjs`, and `recipe-images-local-status.mjs`; these remain covered by PB-203. PB-255 is withdrawn/merged into PB-203.
- `recipe-nutrition-estimate.mjs` and `recipe-recommendation-score.mjs` exist; PB-256 is withdrawn.

### Account-erasure schema inventory

The current Prisma `User` model has explicit cascade relations for AuthAccount, Session, UserSettings, UserPreference, UserProfile, UserOnboarding, AssistantProfile, HealthProfile, NutritionProfile, DailyLog, NutritionLog, FoodItem, Meal, Recipe, InventoryItem, ShoppingItem, Workout, Reminder, Habit, HabitLog, Supplement, SupplementLog, Notification, UserFact, UserBehavior, UserInsight, PlanExecutionState, DecisionAuditEntry, and FitnessProfileState. This establishes broad database cascade coverage, but not complete account erasure: migration-only/user-owned tables are outside the final Prisma model contract, Supabase Auth identity/storage are external, and no authenticated composed delete-account workflow was found. PB-254 remains a closure item.

### Historical catalog reconciliation

The exact historical prose for PB-001..PB-155 remains unavailable from exposed Git history. Existing `12_OPEN_WORK.md` provides the historical ID/index and overlap mapping, but the audit must not fabricate missing prose. Final freeze must explicitly preserve this evidence limitation and must not claim a lossless Appendix recovery unless exact historical text is actually recovered.

## Freeze gate status

OPEN. Remaining gates include safe canonical Appendix merge, complete route↔DTO↔test↔mobile and DB reader/writer/relation/index/transaction matrices, PB-252 decision, PB-254 retention/deletion closure, checkpoint/index synchronization, duplicate/false-positive freeze, and explicit environmental validation limitations.
