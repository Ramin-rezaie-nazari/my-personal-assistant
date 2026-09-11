# Database Audit Matrix — 2026-09-11

Status: IN_PROGRESS — forensic audit only; no production-code remediation.

Audited main: `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`.

## Final Prisma User-owned model surface

The final `User` model has explicit cascade relations for: AuthAccount, Session, UserSettings, UserPreference, UserProfile, UserOnboarding, AssistantProfile, HealthProfile, NutritionProfile, DailyLog, NutritionLog, FoodItem, Meal, Recipe, InventoryItem, ShoppingItem, Workout, Reminder, Habit, HabitLog, Supplement, SupplementLog, Notification, UserFact, UserBehavior, UserInsight, PlanExecutionState, DecisionAuditEntry, FitnessProfileState.

This is broad modeled-record deletion coverage, but it is not complete account-erasure proof because migration-only tables, Supabase Auth identity and Storage objects are outside the final Prisma cascade graph.

## Raw-SQL / migration-only runtime surfaces

| Surface | Reader/writer evidence | Final Prisma model | Transaction/atomicity concern | Canonical finding |
|---|---|---|---|---|
| Goal / GoalCheckin | GoalsService uses `$queryRaw`/`$executeRaw` for create/read/update/check-in/delete | Missing | Check-in parent/child writes are separate | PB-073, PB-074, PB-235 |
| LifeTask / dependency/event compatibility | LifeTasksService and Personal Brain adapters use raw SQL | Missing from final schema | Multiple related writes require explicit review | PB-156/157 and historical DB-contract findings |
| LifeExecution legacy TaskDependency/TaskEvent | LifeExecutionService uses raw SQL | Missing from final schema contract | Legacy table semantics diverge from LifeTasks | PB-157, PB-084 |
| RecipeStep / RecipeMedia | RecipePresentationService reads raw SQL; recipe content scripts call Prisma delegates | Missing | Content importer can partially persist before late failure | PB-036/037, PB-188/193 |
| ConversationTurn | ConversationHistoryService uses raw SQL | Missing | Retention/deletion is not tied to a Prisma relation | PB-005, PB-210 |
| DecisionOutcome | DecisionOutcomeLearningService uses raw SQL | Missing | Learning persistence is outside final Prisma relation graph | PB-004 |
| WorkoutPerformance | Personal Brain workout-memory path uses raw SQL | Missing | Persistence/ownership must be reconciled independently | PB-006 |
| Price Intelligence | PricePersistenceService and related services use raw SQL for tracking/analysis surfaces | Partially outside final model contract | Currency/unit/source consistency and durable history need separate review | PB-057..072 |
| Fitness operational catalog | `fitness-content-balance-levels.mjs` uses raw SQL against `FitnessExerciseCatalog` | Not established as final Prisma model in this audit pass | Script contract must remain aligned with migrations/schema | Existing fitness operational scope |

## Transaction checks completed

Known positive transaction patterns were rechecked in earlier batches: recipe ingredient writes, meal creation, nutrition logging, and fitness content batch updates use explicit transactions where inspected.

Known negative transaction patterns remain canonical:
- Goals check-in updates child and parent without a surrounding transaction (PB-235).
- Shopping `addRecipeMissing()` loops through independent basket mutations without a transaction (PB-241).
- Recipe content import performs multiple related mutations without a transaction (PB-193).

No new finding is created merely because a service uses multiple reads/writes; the audit requires a logically coupled aggregate or atomic batch boundary before classifying it.

## Ownership / indexing checks

Active domain delete/update paths inspected in Inventory, Goals, Habits, Fitness, Workout, Calendar, Reminders, Supplements, Recipes, Shopping, Meals, Foods, Dashboard, Users, Health and Settings generally scope by authenticated user identity before mutating user-owned resources. No new generic IDOR finding was created from this sweep.

Important exception already covered by existing auth identity finding: active FitnessController reads `req.user.sub`, while `JwtStrategy.validate()` returns the loaded User object whose stable identifier is `id` (PB-171 / historical PB-140).

The final Prisma schema contains many user-scoped indexes/unique constraints, but migration-only tables require separate index/FK verification before being considered fully reconciled.

## Remaining DB closure gates

1. Enumerate every migration-created table not represented in `schema.prisma` and map each to readers/writers/tests/transactions/indexes/FKs.
2. Reconcile raw SQL column names and FK assumptions against each migration exactly.
3. Verify transaction boundaries for all multi-write aggregates, not just known findings.
4. Reconcile migration-only user-sensitive tables with account-erasure and retention policy.
5. Compare deployed schema state where environment access exists; repository evidence alone cannot prove production drift.

No production code changed in this matrix.