# My Personal Assistant — Current State

> **Single source of truth for project progress.**
>
> Rule: do not rebuild or retest a green item unless a later change invalidates it. Continue from the first unchecked item in the current workstream.

## Current workstream

### Food Decision Brain — code-complete / external CI validation blocked

```text
Food Decision Brain
███████████████████████░  ~99%

✅ Prisma schema/client + database foundation
✅ Recipe scaling / serving intelligence
✅ Global country / cuisine context
✅ Inventory-aware recipe operating loop
✅ Recommendation ranking
✅ Personalization
✅ Recommendation engine
✅ Focused recommendation tests: 3 suites / 4 tests passed
✅ Backend typecheck passed after Prisma config exclusion fix
✅ Backend unit suite: 156 / 156 suites passed
✅ Backend unit tests: 414 / 414 passed
✅ Recipe image pipeline test: 2 / 2 passed
✅ Recommendation E2E: 1 suite / 2 tests passed
✅ Recommendation E2E authentication coverage
✅ Recommendation E2E deterministic ranking + explanations
✅ Recommendation E2E Prisma cleanup / process-exit fix verified
✅ Final CI validation gates added: Prisma validate/generate/migrate, typecheck, lint, build, unit, E2E
✅ Draft PR created for real GitHub Actions validation: #57
🟡 GitHub Actions runner validation blocked: job failed before executing any step/log
⬜ Re-run external GitHub Actions when runner/infrastructure is available
⬜ Mark Food Decision Brain 100% only after the final CI gate is observable green
```

## Latest validation evidence

- Recommendation focused tests passed: `recommendation-ranking`, `personalization`, and `recommendation-engine` — **4/4 tests green**.
- Full backend unit tests passed: **156/156 suites, 414/414 tests green**.
- Recipe image pipeline test passed: **2/2 tests green** after addressing the Jest ESM import mapping and the image-processing test timeout.
- Backend typecheck passed after excluding `prisma.config.ts` at the root level of `tsconfig.json`.
- Recommendation E2E passed: **1 suite / 2 tests green** with authentication protection and deterministic ranked food recommendations with explanations.
- Recommendation E2E seed data was adjusted to satisfy the protein constraint.
- Prisma module-destroy cleanup was added and the recommendation E2E no longer reports the previous connection-leak warning.
- Final backend CI was expanded to cover Prisma validation/generation/migrations, backend typecheck, lint, build, full unit tests, and API E2E tests.
- A Draft PR #57 was created specifically to obtain an external GitHub Actions validation result; it was not merged.
- GitHub Actions run `32695926602` was started from PR #57 and failed before any job step executed. The job exposed no steps and no downloadable log, and a direct job rerun reproduced the same pre-step failure. Therefore the CI result is treated as an infrastructure/runner blocker, not as evidence of a code regression.

## Validation history / changes in this phase

- Removed the remaining `food-operating-loop.service.ts` lint debt by using the recipe-domain measurement/scaling contracts instead of `any` and deleting the unused measurement helper.
- Added a Jest `moduleNameMapper` so ESM-style `.js` imports resolve correctly against TypeScript sources during unit tests.
- Increased the deterministic recipe-image compression test timeout to 15 seconds because the image-processing workload exceeds Jest's default 5-second timeout on the local environment.
- Hardened Jest E2E setup with deterministic non-secret defaults for `NODE_ENV`, `APP_NAME`, and JWT test configuration while keeping `DATABASE_URL` external.
- Restored `supertest` for backend E2E validation.
- Fixed the recommendation E2E seed so the intended recommendation satisfies the protein constraint and is returned by the ranking pipeline.
- Added Prisma module-destroy cleanup for deterministic E2E teardown.
- Hardened `.github/workflows/backend-ci.yml` to exercise the complete backend validation gate in CI.

## Product direction — permanent architectural constraints

MYPA is intended to become a **Personal Operating System**, not a collection of unrelated features.

The central intelligence layer must coordinate:

```text
Local Brain / AI Core
        │
        ├── conversation + voice
        ├── memory + personalization
        ├── decision + planning
        ├── nutrition + food
        ├── inventory + shopping
        ├── budget + price intelligence
        ├── fitness + camera coaching
        ├── health / wearable data
        ├── reminders + calendar
        └── daily-life execution
```

### Non-negotiable product goals

- Premium, highly animated, responsive, friendly mobile UX.
- Global product: language selection, country selection, locale-aware recommendations, units, currency, timezone, and culturally relevant food guidance.
- Persian-first voice experience for the Iranian market, including conversational Tehran-style Persian, while keeping the architecture multilingual.
- Strong offline/local intelligence so the core app remains useful without requiring a paid cloud AI dependency.
- Provider-agnostic AI routing with free-tier/fallback options; no runtime architecture should depend on a single paid AI vendor.
- Subscription-ready architecture without requiring subscription payments to function in the free product.
- Inventory-aware food planning, budget-aware meal planning, scalable recipes, nutrition constraints, allergies/dietary restrictions, and smart shopping deltas.
- Recipe intelligence must support a large global corpus without repeatedly surfacing near-duplicate recipes.
- Fitness must understand available equipment and adapt training plans accordingly; future camera coaching should use deterministic movement constraints plus local/on-device vision where practical.
- Health/wearable integrations should flow into one internal health model instead of coupling business logic to a single device platform.

## Next workstream after Food Decision Brain reaches 100%

### Local Brain / AI Core

Build the central orchestration layer before expanding major user-facing AI features.

```text
Voice / Text
    ↓
Intent + Entity Understanding
    ↓
User Context + Memory
    ↓
Decision / Planning
    ↓
Tool Orchestration
    ↓
Nutrition | Food | Fitness | Health | Life | Finance
    ↓
Local / Free Provider Router
```

The local model is **not** expected to imitate a frontier chatbot by itself. The intelligence should come from the combination of deterministic engines, structured data, retrieval, memory, rules, personalization, tool calling, and a small local model.

## Longer-term roadmap

```text
[CURRENT]
Food Decision Brain → ~99%
        ↓
External GitHub Actions runner becomes available
        ↓
Full CI gate green
        ↓
Food Decision Brain → 100%
        ↓
Local Brain / AI Core
        ↓
Voice-first Persian + multilingual voice architecture
        ↓
Globalization / country-aware UX
        ↓
Inventory + budget + live price intelligence
        ↓
Global recipe intelligence / deduplication / provenance
        ↓
Health + wearable data layer
        ↓
Fitness coach + camera movement analysis
        ↓
Premium mobile UX / animation polish
        ↓
Production hardening + privacy/security
        ↓
Subscription activation (without redesigning the core)
```

## Working rule

Every work session starts here. Read this file, inspect the repository, and continue from the **first unchecked item of the current workstream**. When an item becomes green, record the exact validation result here immediately.
