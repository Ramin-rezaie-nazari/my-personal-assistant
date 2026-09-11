# Fitness Deep Read

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: `fitness` module/controller/model/fitness profile persistence/in-memory service/test; `workout` module/controller/DTO/service/spec; `calisthenics` module/controller/model/library/session-generator/coach/specs; `gym` module/model/library/session-generator/spec; `yoga` module/controller/models/library/session-generator/coach/motion-analysis/specs. Module registration/consumption was cross-searched through `app.module.ts` and `personal-brain.module.ts`. Runtime execution not performed.
Scope not yet read: all Fitness-adjacent source outside the inspected clusters where Fitness behavior may be consumed; Mobile fitness/yoga/calisthenics/pose pipeline; Platform/Tests/CI; full repository-wide consumer/API/database/transaction reconciliation; runtime validation.
Evidence roots: `apps/backend/src/modules/fitness/`; `workout/`; `calisthenics/`; `gym/`; `yoga/`; `apps/backend/src/modules/personal-brain/`; `apps/backend/src/app.module.ts`; Prisma `schema.prisma`.
Confidence level: HIGH for file-level findings in inspected clusters; MEDIUM for cross-module impact until Mobile and all consumers are reconciled.
Open questions: mobile contract parity, actual runtime route behavior, broader workout/progression consumers, pose-provider implementation parity, safety-policy depth and persistence of workout-plan state.

## Findings

### Fitness profile
- The active Nest token is `FitnessProfileService`, but `fitness.module.ts` binds it to `FitnessProfilePersistenceService` via `useExisting`. A separate `FitnessProfileService` implementation remains in the tree and stores profiles in a process-local `Map`. Its direct spec tests that in-memory implementation rather than the active persistent implementation. This creates dual behavior and false regression coverage: the test suite can pass while the production token executes different code.
- `FitnessProfilePersistenceService.normalize()` checks only broad object/array shape. Because the fitness model is compile-time TypeScript types, malformed enum strings, invalid priorities, impossible session durations, duplicate/invalid equipment records and arbitrary metadata can still be persisted.
- The active and inactive `parseNaturalGoal()` implementations are behaviorally different: the persistent implementation only lowercases text, while the inactive implementation additionally normalizes Persian character variants, zero-width joiners and whitespace and uses different `avoidBulk` matching. A future consumer of either implementation can therefore parse the same user text differently.
- Fitness controller write routes use inline object bodies instead of DTOs and runtime validation. The authenticated routes are guarded, but contract constraints are not expressed at the API boundary.
- Natural goal IDs are generated with `Date.now()` in the active persistence implementation, making IDs unstable and potentially colliding for rapid same-millisecond calls.

### Workout
- Workout controller is JWT/user scoped, and ownership is enforced in update/delete queries. However `PATCH /workout/:id` accepts `Partial<CreateWorkoutDto>` inline rather than a dedicated validated update DTO.
- `CreateWorkoutDto` has no class-validator decorators. `WorkoutService.createWorkout()` trims `name`/`type` but does not reject empty strings, and supplied `performedAt` is converted directly with `new Date(...)` without explicit validity checking before persistence. Numeric validation covers finiteness and non-negativity but has no domain upper bounds.
- Weekly summary uses UTC date boundaries and date keys. Without an explicit user-timezone conversion, weekly active-day/streak semantics can differ from the user's local calendar around midnight.
- Existing workout tests cover basic create/summary/ownership behavior but not the invalid-date, empty-name/type, numeric-boundary, or timezone cases.

### Calisthenics
- Controller routes are individually JWT guarded, but session/coach request bodies are inline and lack DTO/runtime validation.
- `CalisthenicsSessionGeneratorService.generate()` does not validate `durationMin`. It chooses between four and eight exercises using `Math.max(4, Math.min(8, Math.floor(durationMin / 5)))`, so very short requested durations still receive at least four steps while the returned `durationMin` remains the raw request. The generated workload therefore is not guaranteed to fit the requested duration.
- Coach state is purely process/request-derived; there is no persistence of session execution in this module. This must be reconciled with the canonical Workout/plan state model later.

### Gym
- Gym is an internal provider module with no controller; it is consumed through exports by higher-level modules. This is not itself an issue, but it means its public contract is dependency-based rather than route-based.
- `GymSessionGeneratorService.generate()` silently clamps duration to 10..120 minutes, then selects 3..8 exercises based on a coarse duration formula. The response exposes the clamped duration, not whether the request was coerced, and the selected set/rep/rest workload is not explicitly timed against the final requested duration.
- Gym services are deterministic and in-memory; no durable workout-plan/progression state is owned by this module.

### Yoga
- Yoga routes are individually JWT guarded, but controller request bodies are inline and lack DTO/runtime validation.
- `YogaSessionGeneratorService.generate()` silently clamps duration to 5..120 minutes. It attempts to fit holds/rest into the target seconds, which is stronger than the Calisthenics/Gym generators, but there is no explicit input validation before rounding/clamping.
- Yoga motion analysis consumes `PoseFrame` data and uses `overallConfidence` as the final confidence gate. Individual `BodyLandmark.confidence` values are defined in the model but are not incorporated into metric validity/scoring. A frame can therefore have high overall confidence while containing low-confidence landmarks used by a rule.
- When a required landmark is missing, `angle()` returns `180`, which is a plausible numeric angle rather than a missing-data signal. Depending on the rule, this can create a misleading correction or an apparently valid measurement instead of explicitly flagging insufficient landmarks.
- The backend declares a `PoseProvider` interface, while search found a separate Mobile `PoseProvider` type/implementation contract. These are not the same TypeScript contract, so parity must be reconciled during Mobile audit.
- Yoga library is hard-coded in memory and contains safety/contraindication metadata, but no persistence or versioning layer for pose definitions was found in the inspected scope.

## Preliminary Fitness issue IDs

- PB-089: Fitness controller write bodies lack DTO/runtime validation.
- PB-090: Active persistent and inactive in-memory FitnessProfileService implementations coexist; direct tests cover the inactive implementation instead of the production binding.
- PB-091: Fitness profile normalization accepts malformed enum/range/content data because it validates only broad array/object shape.
- PB-092: Fitness active/inactive natural-goal parsers diverge in Persian normalization and avoid-bulk semantics.
- PB-093: Workout patch uses inline partial DTO and create DTO has no runtime validation; empty names/types and invalid dates are not explicitly rejected.
- PB-094: Workout weekly summary uses UTC calendar semantics without explicit user-local timezone conversion.
- PB-095: Calisthenics session generator does not guarantee the generated workload fits requested duration and lacks input validation.
- PB-096: Gym session generator silently coerces duration and uses coarse exercise-count timing rather than explicit session workload fitting.
- PB-097: Yoga controller inputs lack DTO/runtime validation.
- PB-098: Yoga motion analysis ignores per-landmark confidence and treats missing landmarks as angle=180 instead of explicit missing-data state.
- PB-099: Backend PoseProvider contract differs from the Mobile PoseProvider contract discovered by cross-search.

## Remaining work

Finish Fitness-adjacent source trees that are in scope, reconcile route consumers with Mobile, inspect platform/test harness coverage, then sync the global file index, contract matrix, feature matrix, checkpoints, review gaps, changelog and issue catalog. Do not mark this deep read complete until all Fitness scope is explicit and unexplained gaps are removed.
