# Database Audit Matrix — 2026-09-11

Status: SOURCE-LEVEL AUDIT COMPLETE; DEPLOYED-DB VALIDATION ENVIRONMENTALLY BLOCKED.

Audited main: `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`.

## Scope closed

The audit covered the final Prisma schema, all repository migrations previously read in the audit batches, raw-SQL readers/writers, active Prisma readers/writers, ownership predicates, relation/FK assumptions, transaction boundaries, user/time query indexes, migration-only tables, operational SQL surfaces, and account-erasure implications. No production-code remediation was performed.

## Final Prisma User-owned model surface

The final `User` model has explicit cascade relations for modeled user-owned records including AuthAccount, Session, UserSettings, UserPreference, UserProfile, UserOnboarding, AssistantProfile, HealthProfile, NutritionProfile, DailyLog, NutritionLog, FoodItem, Meal, Recipe, InventoryItem, ShoppingItem, Workout, Reminder, Habit, HabitLog, Supplement, SupplementLog, Notification, UserFact, UserBehavior, UserInsight, PlanExecutionState, DecisionAuditEntry and FitnessProfileState.

This is broad modeled-record deletion coverage, but it is not complete account-erasure proof because migration-only tables, Supabase Auth identity and Storage objects are outside the final Prisma cascade graph. PB-211/PB-254 remain the canonical account-erasure findings.

## Migration-only / raw-SQL contract matrix

| Surface | Reader/writer evidence | Final Prisma model | FK/relation status | Transaction/atomicity | Canonical finding |
|---|---|---|---|---|---|
| Goal / GoalCheckin | GoalsService raw SQL for create/read/update/check-in/delete | Missing | Migration FK/unique contract verified in prior DB pass | Check-in parent/child writes are separate | PB-073, PB-074, PB-235 |
| LifeTask / dependency/event compatibility | LifeTasksService + Personal Brain adapters | Missing | Migration-only relationship contract reconciled | Related writes require explicit review | PB-156/157 + historical DB findings |
| LifeExecution legacy TaskDependency/TaskEvent | LifeExecutionService raw SQL | Missing | Legacy relation semantics differ from LifeTasks | Parallel aggregate semantics remain | PB-157, PB-084 |
| RecipeStep / RecipeMedia | RecipePresentationService raw SQL; content scripts use Prisma delegates | Missing | Migration tables exist outside final Prisma client model | Importer can partially persist | PB-036/037, PB-188/193 |
| ConversationTurn | ConversationHistoryService raw SQL | Missing | Outside final Prisma cascade graph | Retention not durably enforced | PB-005, PB-210 |
| DecisionOutcome | DecisionOutcomeLearningService raw SQL | Missing | Outside final Prisma relation graph | Learning persistence independent | PB-004 |
| WorkoutPerformance | Personal Brain workout-memory raw SQL | Missing | Ownership/relation contract separately reconciled | Runtime DB plan unavailable | PB-006 |
| Price Intelligence | PricePersistenceService and related raw SQL surfaces | Partial/outside final model contract | Source/FK/unit contracts reconciled | Operational history requires runtime DB validation | PB-057..072 |
| Fitness operational catalog | `fitness-content-balance-levels.mjs` raw SQL | Not established as final Prisma model | Migration/script contract reviewed | Script remains operational surface | Existing fitness operational scope |

No additional migration-only/raw-SQL finding was created merely from repeated `$queryRaw` usage; only concrete contract/atomicity/ownership/index defects are counted.

## Transaction closure

Positive transaction patterns were rechecked in earlier batches: recipe ingredient writes, meal creation, nutrition logging, and fitness content batch updates use explicit transactions where inspected.

Canonical negative boundaries:
- PB-235 — Goals check-in child/parent writes are not atomic.
- PB-241 — Shopping recipe-missing basket batch is not atomic.
- PB-193 — Recipe content importer related mutations are not atomic.

No other inspected multi-write path met the audit threshold for a new unique transaction finding.

## Ownership / authorization closure

Active domain delete/update paths inspected in Inventory, Goals, Habits, Fitness, Workout, Calendar, Reminders, Supplements, Recipes, Shopping, Meals, Foods, Dashboard, Users, Health and Settings generally scope user-owned resources by authenticated identity. No new generic IDOR finding was established. PB-171 remains the canonical Fitness/JWT identity-shape issue.

## Index closure

PB-257 is the canonical source-level index finding: `Workout(userId, performedAt)` and `UserBehavior(userId, createdAt)` do not have matching composite indexes despite active chronological per-user reads. This is intentionally not sized as a production incident because deployed row counts/query plans are unavailable.

Other inspected user-scoped indexes/unique constraints were reconciled against their dominant access patterns without a new unique finding.

## Account-erasure closure boundary

Source-level search found no composed account-erasure workflow (`prisma.user.delete`, `deleteUser`, or Supabase Auth admin-delete). Existing session deletion and Prisma cascades are not equivalent to a complete user erasure workflow. PB-211/PB-254 remain explicit unresolved policy/workflow findings.

## Final source-level conclusion

The DB audit gate is **CLOSED FOR SOURCE EVIDENCE**. The remaining database limitation is environmental: production/deployed PostgreSQL state, RLS, Supabase Storage, and external Auth configuration cannot be inspected from this connector and therefore remain UNVERIFIED rather than PASS.

No production code changed.