# BODINEXT → MYPA Feature Mapping

Last updated: 2026-09-14
Status: PRODUCT GAP ANALYSIS / REFERENCE DESIGN

## Purpose

This document maps the publicly observable BODINEXT product surface that we reviewed against the capabilities that are actually represented in the MYPA repository. It is a product-gap document, not an audit-status replacement. Repository truth remains `docs/05_CURRENT_STATE.md`, while implementation findings remain in `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md`.

The target is not to copy BODINEXT. The target is to use it as a domain reference for Fitness/Nutrition content and then extend the same foundation into a broader personal lifestyle assistant.

## Status legend

- **GREEN — present**: meaningful repository implementation exists and is part of the active architecture.
- **AMBER — partial**: core domain logic exists, but the user-facing/content/media/integration surface is not yet equivalent to the reference product.
- **RED — missing**: no sufficient repository evidence of the capability.
- **BETTER-BY-DESIGN**: intentionally goes beyond the reference rather than matching it one-to-one.

---

## Executive assessment

MYPA is **architecturally aligned with the Fitness/Nutrition direction of BODINEXT**, but it is **not currently a BODINEXT-equivalent consumer product**.

The current repository already contains a stronger decision-oriented fitness foundation than a simple workout app: fitness profile/goal/equipment models, Gym/Calisthenics/Yoga session generators, progression logic, skill-unlock logic and a Personal Brain fitness orchestrator are all present. The orchestrator can choose a discipline, adapt duration from performance/progression, map available equipment and generate a session from the selected provider.

What MYPA lacks compared with a content-heavy fitness platform is mainly the **content and experience layer**: a large exercise catalog, rich exercise metadata at product scale, owned/authorized exercise media/video library, polished program browsing, program/plan persistence as a first-class user experience, and a mature content-authoring/publishing pipeline.

MYPA additionally has a much broader product direction than BODINEXT: inventory, meals, recipes, shopping, calendar, reminders, habits, supplements, daily command center, assistant/brain, recommendations and decision feedback are already represented in the repository. These should be connected so that Fitness becomes one input into a cross-domain personal assistant rather than a standalone module.

---

## 1. Fitness profile and personalization

| BODINEXT reference capability | MYPA evidence | Status | Product decision |
|---|---|---|---|
| Body/personal profile | Fitness profile domain with disciplines, goals, equipment, constraints, preferred session durations | GREEN | Keep and expand with measurable body metrics where appropriate |
| Goal selection | Goal kinds include strength, hypertrophy, fat loss, body sculpt, mobility, conditioning, skill and general fitness | GREEN | Keep as canonical goal taxonomy |
| Target body areas | BodyTarget supports full body, shoulders, arms, chest, back, core, waist, hips, glutes, thighs, legs, calves | GREEN | Keep; add finer muscle taxonomy only when needed by content engine |
| Equipment-aware programming | Equipment model includes dumbbells, barbell, bench, pull-up bar, parallel bars, rings, bands, cable, treadmill, bike, dip belt, mat and more | GREEN | Make equipment filtering first-class in the content engine |
| Training constraints | Low impact, avoid high volume, minimize bulk, no jumps, quiet home, short sessions | GREEN | Important differentiator for personal recommendations |
| Deep personalization from multiple inputs | Personal Brain fitness decision + session orchestration consumes profile context, request and performance | AMBER → GREEN | Make profile + performance + schedule + recovery a unified recommendation context |
| Photo-based body assessment | No verified equivalent in current repository evidence | RED | Optional later capability; do not make MVP dependency |

Evidence: `apps/backend/src/modules/fitness/models/fitness.model.ts`; `apps/backend/src/modules/personal-brain/services/fitness-session-orchestrator.service.ts`.

---

## 2. Workout/program generation

| BODINEXT reference capability | MYPA evidence | Status | Product decision |
|---|---|---|---|
| Personalized workout plan | Gym/Calisthenics/Yoga generators exist and are orchestrated by Personal Brain | AMBER | Upgrade generated sessions into durable plans/programs |
| Gym programming | `GymSessionGeneratorService` selects exercises by level/focus/equipment, calculates sets/reps/rest and difficulty | GREEN | Keep; connect to canonical Exercise DB |
| Calisthenics programming | Dedicated generator and skill-unlock logic exist | GREEN | Keep; make progression graph persistent |
| Yoga programming | Dedicated generator plus motion-analysis path exists | GREEN | Keep; strengthen safety and confidence semantics |
| Duration-aware sessions | Orchestrator modifies effective duration using progression; providers also clamp duration | GREEN | Replace implicit coercion with explicit validated workload fitting |
| Performance-driven progression | `FitnessProgressionService` and generator level adaptation use form/completion/difficulty signals | GREEN | Make this part of the long-term adaptive program engine |
| Program history/progression persistence | Workout logging is persisted; durable generated-program state is not yet a clearly canonical domain | AMBER | Add WorkoutPlan/Program/ProgramVersion/SessionAssignment model |
| Ready-made program library | No clear first-class catalog equivalent to BODINEXT's visible program/product catalog | RED | Add curated programs after Exercise DB foundation |

Evidence: `gym-session-generator.service.ts`, `fitness-session-orchestrator.service.ts`, workout service, Fitness deep-read.

---

## 3. Exercise library

This is the biggest reference-product gap.

| BODINEXT reference capability | MYPA evidence | Status | Product decision |
|---|---|---|---|
| Large exercise database | Current code has provider-specific in-memory libraries, but no unified product-scale Exercise DB is evidenced | AMBER | Build canonical Exercise entity/content system |
| Filter by equipment | Provider libraries already use equipment | GREEN | Promote to cross-provider query/filter contract |
| Filter by muscle | BodyTarget exists, but a rich canonical muscle/exercise taxonomy is not yet the consumer-facing source of truth | AMBER | Build normalized muscle/action taxonomy |
| Filter by level | Gym/Calisthenics/Yoga all have level concepts | GREEN | Normalize into shared Difficulty taxonomy + provider-specific nuances |
| Filter by exercise type/goal | Fitness goals/focus types exist | GREEN | Link exercise metadata to goals and movement patterns |
| Exercise instructions | Provider libraries contain coach cues/instruction-like metadata | AMBER | Create structured instructions as content, separate from generator logic |
| Exercise alternatives | Not evidenced as a canonical cross-exercise relationship | RED | Add substitute/progression/regression relationships |
| Exercise media/video | No evidence of a mature owned/authorized video catalog in repository | RED | Build `ExerciseMedia` architecture and licensed/owned media pipeline |
| Exercise detail pages | No equivalent consumer content surface proven from current repository inventory | RED | Build mobile exercise detail UX |

### Canonical Exercise model target

`Exercise`
→ identity / aliases / localized names
→ discipline
→ movement pattern
→ primary + secondary muscles
→ equipment
→ difficulty
→ goals
→ contraindications / caution metadata
→ instructions
→ coach cues
→ common mistakes
→ progression / regression
→ alternatives
→ media references
→ content/version status

This should be the canonical source consumed by Gym, Calisthenics, Yoga and future cardio/program engines rather than keeping exercise knowledge fragmented inside providers.

---

## 4. Video/media library

BODINEXT's exercise experience strongly depends on media/visual instruction. MYPA should reach the same UX quality, but the media must be content we are authorized to store/display.

| Capability | MYPA status | Required action |
|---|---|---|
| Exercise thumbnail/poster | RED | Add media contract |
| Exercise instructional video | RED | Add authorized/owned video source strategy |
| Multiple media per exercise | RED | Support video, image, animated/demo variants |
| Media ordering/quality | RED | Add duration, resolution, language, aspect ratio, poster metadata |
| Offline/local caching | RED | Later mobile optimization, not MVP blocker |
| Media entitlement/availability | RED | Store license/source/visibility metadata |

Recommended architecture:

`Exercise → ExerciseMedia → Storage/CDN → Mobile Player`

The app should never hard-depend on scraping a third-party website at runtime.

---

## 5. Nutrition and diet

| BODINEXT reference capability | MYPA evidence | Status | Product decision |
|---|---|---|---|
| Dietary plans | Nutrition, Meals, Recipes and Meal Planning domains exist | GREEN | Keep and connect to assistant decisions |
| Calories/protein tracking | Nutrition logs + daily summaries exist | GREEN | Make this a core daily metric |
| Recipe database | Recipes/Foods/Meals modules are substantial | GREEN | Expand content depth and media |
| Serving scaling | Recipe Intelligence scaler supports multiple scaling policies | GREEN | Keep as canonical scaling engine |
| Personalized recommendations | Recipe recommendation surfaces exist, but Recommendation Intelligence is still partly placeholder-level | AMBER | Consolidate recommendation ownership |
| Country/cuisine routing | 195-country food profile map exists | GREEN | Use it as cultural routing, not exhaustive cuisine truth |
| Budget-aware meal planning | Budget Intelligence exists but several services remain placeholder-level | AMBER | Later strengthen using real price and inventory context |
| Recipe media/steps completeness | Recipe presentation reads RecipeStep; lifecycle does not fully author/manage steps/media | AMBER | Make recipe content lifecycle first-class |

Evidence: `docs/project-brain/08_RECIPE_FOOD_SYSTEM.md`.

---

## 6. Calculators and health utilities

The reference product exposes calculator-style utilities. MYPA has the ingredients for these calculations distributed across its broader lifestyle/nutrition design, but they are not currently the defining consumer surface.

| Utility | MYPA status | Product decision |
|---|---|---|
| BMI | AMBER | Add as a small profile/health utility if medically appropriate |
| BMR | AMBER | Canonicalize calculation service |
| TDEE / daily calories | AMBER | Canonicalize and connect to nutrition goals |
| Body-fat estimate | AMBER | Add cautiously with transparent methodology |
| Water target | GREEN/AMBER | Daily water tracking already exists; centralize target calculation |
| Activity calories | AMBER | Connect workout records + user profile |

These should be **supporting primitives**, not the main product architecture.

---

## 7. Dashboard and daily experience

| BODINEXT reference capability | MYPA evidence | Status | Product decision |
|---|---|---|---|
| User dashboard | Dashboard + Daily Command Center modules exist | GREEN | Make this the cross-domain home |
| Workout history | Workout persistence + weekly summary exist | GREEN | Expand to volume, progression and adherence |
| Daily plan | Daily/Command Center exists | GREEN | Make Fitness one coordinated part of the day |
| Reminders | Reminder module exists | GREEN | Tie reminders to workouts, meals, supplements and medication where appropriate |
| Calendar | Calendar module exists | GREEN | Use scheduling to resolve workout/meal timing conflicts |
| Habits | Habit module exists | GREEN | Connect habits to goals and adherence |

Evidence: current mobile catalog and current-state documentation.

---

## 8. The MYPA advantage: cross-domain loop

BODINEXT is primarily a fitness/nutrition platform. MYPA can turn the same ideas into a closed-loop lifestyle system:

`Profile`
→ `Goals`
→ `Today Context`
→ `Workout Decision`
→ `Workout Session`
→ `Performance Log`
→ `Progression`
→ `Nutrition`
→ `Recipe`
→ `Home Inventory`
→ `Shopping`
→ `Calendar/Reminder`
→ `Assistant Feedback`
→ `Next Decision`

Example:

1. User has a hypertrophy goal.
2. MYPA sees today's available 45 minutes and available equipment.
3. Fitness Brain creates the session.
4. Exercise cards show the selected movement and authorized instructional media.
5. User completes only 70% of the session and reports high difficulty.
6. Performance is stored.
7. Progression policy reduces or preserves next-session load.
8. Nutrition context sees that protein target is still short.
9. Inventory shows eggs, chicken and rice at home.
10. MYPA proposes a dinner using those ingredients and logs the meal.
11. Missing ingredients are added to Shopping.
12. Tomorrow's calendar is considered before the next workout recommendation.

This cross-domain loop is the strategic product difference and should remain central.

---

## 9. What to copy / improve / avoid

### COPY / KEEP

- Deep fitness profile and constraints.
- Equipment-aware recommendations.
- Goal-oriented workout generation.
- Exercise content catalog concept.
- Recipe and nutrition content library.
- Calculator utilities as supporting tools.
- Strong visual instruction around workouts.
- Personalized plan concept.

### IMPROVE

- Replace isolated generated sessions with durable programs and progression history.
- Replace fragmented provider libraries with a canonical Exercise DB.
- Add structured exercise alternatives and progression/regression.
- Add first-class media/content management.
- Make nutrition, inventory and shopping part of workout-aware decisions.
- Make recommendations explainable and deterministic where possible.
- Use AI mainly for conversation and interpretation, not as the source of truth for numeric/domain decisions.

### DO NOT COPY

- A business model that depends on a human/manual turnaround for every personal plan.
- Content locked inside static pages without structured domain data.
- Runtime scraping or third-party page dependence for core exercise/video delivery.
- Duplicate recommendation engines with competing ownership.
- Separate fitness logic that cannot consume daily/lifestyle context.

---

## 10. Recommended implementation order

### Phase A — Exercise foundation

1. Canonical Exercise schema/domain.
2. Muscle, movement-pattern, equipment and difficulty taxonomies.
3. Exercise relationships: alternative/progression/regression.
4. Exercise content authoring/import pipeline.
5. Exercise media contract and authorized storage strategy.

### Phase B — BODINEXT-equivalent fitness UX

6. Exercise library/search/filter mobile screens.
7. Exercise detail screen.
8. Video/media player.
9. Curated workout programs.
10. Personalized plan view.
11. Session execution and completion UX.

### Phase C — Adaptive fitness

12. Durable Program/Plan/Assignment persistence.
13. Performance logging at exercise/set level.
14. Progression/deload rules.
15. Recovery/context signals.
16. Brain-driven session adaptation.

### Phase D — MYPA differentiation

17. Fitness-aware meal recommendations.
18. Inventory-aware post-workout meals.
19. Shopping integration.
20. Calendar-aware training decisions.
21. Habit/reminder reinforcement.
22. Unified daily command center.

---

## Bottom line

The current MYPA repository already contains a **real fitness decision/generation foundation**; it is not merely a blank shell. The important missing layer for matching the visible BODINEXT experience is the **canonical content + media + program UX layer**.

Therefore the next major Fitness build should **not** start by rewriting Gym/Calisthenics/Yoga. It should start by building the shared Exercise/content/media foundation and then connect the existing generators and Personal Brain to it.

That approach preserves current architecture, avoids duplicated exercise knowledge, and makes it possible to build a product that feels like a much more powerful BODINEXT rather than a clone.
