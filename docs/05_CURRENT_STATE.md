# My Personal Assistant — Current State

> **Single source of truth for project progress.**
>
> Rule: do not rebuild or retest a green item unless a later change invalidates it. Continue from the first unchecked item in the current workstream.

## Current workstream

### Post-Food Decision Brain — Persistent User Context + UX foundation

```text
Remember-once user context
██████████████████████████  100% code-complete

✅ Structured profile facts are already persisted in existing UserProfile / HealthProfile / NutritionProfile / AssistantProfile models
✅ Existing durable memory layer reused instead of creating a parallel memory system
✅ UserContextService upgraded from placeholder to real persistent-context hydration
✅ Age / gender / height / weight / activity / target weight hydration
✅ Nutrition goals / diet type / water / fitness / exercise / sleep context hydration
✅ Language / timezone / notification / reminder preference hydration
✅ Stable constraints and active life areas derived centrally
✅ Relevant durable memory surfaced as known facts
✅ Context precedence contract documented: explicit current input > structured profile > durable memory > inference
✅ BrainStateService now injects hydrated user context into every Brain request
✅ Dedicated UserContextService unit coverage added
✅ UX contract documented: voice-first, low-manual-input, remember-once, purposeful animation
⬜ Run local typecheck + focused UserContextService tests on the updated branch
⬜ Build the visible voice-first assistant shell around this contract
⬜ Add real voice capture / speech pipeline without making paid cloud AI mandatory
```

## Food Decision Brain status

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
✅ Final local backend validation gate: Prisma validate/generate, build, 156/156 unit suites and 5/5 E2E suites green
🟡 Final external GitHub Actions runner validation remains blocked by runner/infrastructure failure before job steps
⬜ Re-run external GitHub Actions when runner/infrastructure is available
⬜ Mark Food Decision Brain 100% only after the final external CI gate is observable green
```

## Latest validation evidence

- Recommendation focused tests passed: `recommendation-ranking`, `personalization`, and `recommendation-engine` — **4/4 tests green**.
- Full backend unit tests passed: **156/156 suites, 414/414 tests green**.
- Recipe image pipeline test passed: **2/2 tests green** after addressing the Jest ESM import mapping and the image-processing test timeout.
- Backend typecheck passed after excluding `prisma.config.ts` at the root level of `tsconfig.json` during the earlier validation pass.
- Recommendation E2E passed: **1 suite / 2 tests green** with authentication protection and deterministic ranked food recommendations with explanations.
- Final local validation pass reached **156/156 unit suites, 414/414 unit tests, and 5/5 E2E suites, 26/26 E2E tests green**.
- The local validation pass also confirmed Prisma schema validation/generation and backend build success.
- The current branch includes the persistent user-context hydration work added after the last complete validation pass; rerun the focused checks before calling this new workstream green.

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
- Core stable user facts must be remembered after one-time collection and must not be repeatedly requested by feature-specific screens.

## Next workstream

### Voice-first Assistant Shell

Build the visible interaction layer around the persistent context contract:

```text
Listening
   ↓
Understanding
   ↓
Thinking
   ↓
Acting
   ↓
Done
```

The shell should make the app feel alive without making the feature graph visible. Users should be able to accomplish common tasks by speaking naturally, with manual controls available only as fallback.

The local model is **not** expected to imitate a frontier chatbot by itself. The intelligence should come from the combination of deterministic engines, structured data, retrieval, memory, rules, personalization, tool calling, and a small local model.

## Working rule

Every work session starts here. Read this file, inspect the repository, and continue from the **first unchecked item of the current workstream**. When an item becomes green, record the exact validation result here immediately.
