# My Personal Assistant — Current State

> **Single source of truth for project progress.**
>
> Rule: do not rebuild or retest a green item unless a later change invalidates it. Continue from the first unchecked item in the current workstream.

## Current workstream

### Food Decision Brain — near complete / validation phase

```text
Food Decision Brain
█████████████████████░  ~97%

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
🟡 E2E harness hardened; final CI validation pending
⬜ Full backend E2E validation on the final branch state
⬜ Final lint/build confirmation on the final branch state
⬜ Mark Food Decision Brain 100%
```

## Important validation history

- Recommendation focused tests passed: `recommendation-ranking`, `personalization`, and `recommendation-engine` — **4/4 tests green**.
- Full backend unit tests passed: **156/156 suites, 414/414 tests green**.
- Recipe image pipeline test passed: **2/2 tests green** after addressing the Jest ESM import mapping and the image-processing test timeout.
- Backend typecheck reached green after excluding `prisma.config.ts` at the root level of `tsconfig.json`.
- Remaining recipe operating-loop lint errors were reduced to warnings and then the remaining unsafe `any` usage / unused helper were removed in the current branch.
- E2E test setup is now deterministic for clean checkouts: `test/setup/jest.setup.ts` supplies test-only `APP_NAME` and JWT defaults while still allowing caller-provided values. `DATABASE_URL` remains external and required.
- Recommendation E2E is now green: **1 suite / 2 tests passed**. Authentication protection and deterministic ranked food recommendations with explanations both pass.
- Recommendation E2E seed data was adjusted to satisfy the protein constraint, and Prisma module cleanup was added so the test process exits cleanly without the previous open-connection warning.
- Latest verified recommendation-validation commit: `7608f63b` (`fix(backend): close prisma connection on module destroy`).

## Changes made in this validation pass

- Removed the remaining `food-operating-loop.service.ts` lint debt by using the recipe-domain measurement/scaling contracts instead of `any` and deleting the unused measurement helper.
- Added a Jest `moduleNameMapper` so ESM-style `.js` imports resolve correctly against TypeScript sources during unit tests.
- Increased the deterministic recipe-image compression test timeout to 15 seconds; the test is computationally heavier than a normal unit test and previously hit Jest's default 5-second limit.
- Hardened Jest E2E setup with deterministic non-secret defaults for `NODE_ENV`, `APP_NAME`, and JWT test configuration, eliminating dependence on an untracked `.env.test` for those values.
- Updated backend CI to run on `main` and `work/**` branches and added manual `workflow_dispatch`, so work branches can be continuously validated instead of relying only on local testing.
- Restored `supertest` for backend E2E validation and verified the recommendation E2E end-to-end.
- Fixed the recommendation E2E seed so the intended recommendation survives the protein constraint and is returned by the ranking pipeline.
- Added Prisma module-destroy cleanup and verified the recommendation E2E no longer reports the previous `Jest did not exit` connection warning.

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
Food Decision Brain → ~97%
        ↓
Full backend E2E validation
        ↓
Final lint/build confirmation
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
