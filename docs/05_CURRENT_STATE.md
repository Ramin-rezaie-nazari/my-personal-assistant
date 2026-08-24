# My Personal Assistant — Current State

> **A — Single source of truth for project progress.**
>
> Rule: do not rebuild or retest a green item unless a later change invalidates it. Continue from the first unchecked item in the current workstream.
>
> **Fixed file aliases:**
> - **A** = `docs/05_CURRENT_STATE.md`
> - **B** = `docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`
>
> Every work session must read **A and B first**.

## Current workstream

### Global Voice + Multilingual Understanding

```text
Global Voice + Multilingual Understanding
███████████░░░░░░░░░░░  ~35%

✅ Existing persistent user context reused by the assistant layer
✅ UX contract: voice-first, low-manual-input, remember-once, purposeful animation
✅ Animated interaction state machine: idle → listening → thinking → speaking → done
✅ Voice-first assistant shell added to the mobile assistant screen
✅ Text input retained only as a fallback path
✅ Ten persistent voice character presets: 5 feminine + 5 masculine
✅ Tehran-style Persian voice identity encoded as a product contract
✅ Voice selection persisted locally and restored automatically
✅ Native Persian speech recognition adapter added
✅ On-device recognition preferred whenever the device reports support
✅ Persian contextual vocabulary supplied to speech recognition
✅ Device TTS response path added through Expo Speech
✅ Voice provider remains replaceable; no paid cloud voice is required by the base flow
✅ Duplicate voice-submit race guarded in the assistant shell
✅ Global voice-language capability registry introduced
✅ Language, region, RTL direction, STT locale and TTS locale are modeled independently
✅ Voice profiles can resolve their locale without coupling character identity to a vendor voice ID
✅ Language picker now exposes the global voice-language catalog
✅ Recent mobile voice TypeScript issues fixed in the implementation branch
⬜ Validate multilingual language picker and voice flow on a real development build / device
⬜ Add provider interface for offline/local STT routing
⬜ Add provider interface for offline/local TTS routing
⬜ Add multilingual local/edge STT capability detection and fallback policy
⬜ Add multilingual local/edge TTS capability detection and fallback policy
⬜ Add language detection for natural speech and code-switching
⬜ Expand LocalLanguageUnderstandingService from Persian/English patterns to locale-aware intent/entity understanding
⬜ Add multilingual normalization, numbers, dates, time, units, food terms and colloquial speech handling
⬜ Add country-aware locale and language policy so one language can map to multiple regional behaviors
⬜ Add language-specific safety/confirmation phrasing while preserving one internal intent model
⬜ Validate representative conversations for the supported global language set
⬜ Mark Global Voice + Multilingual Understanding 100% only after real speech understanding + speech output are validated across the supported language matrix
```

## Previous completed work

### Persistent User Context

```text
Persistent User Context
██████████████████████████  100%

✅ Stable profile and preference hydration
✅ Brain state normalization
✅ Remember-once behavior
✅ Source precedence and durable-memory rules
✅ User context tests green
```

### Voice-first Assistant Shell

```text
Voice-first Assistant Shell
██████████████████████████  100% code-complete

✅ Existing persistent user context reused by the assistant layer
✅ Voice-first assistant shell
✅ Animated interaction state machine
✅ Ten persistent voice character presets: 5 feminine + 5 masculine
✅ Tehran-style Persian voice identity
✅ Persistent voice selection
✅ Persian recognition adapter
✅ Device TTS response path
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
- Final local backend validation pass reached **156/156 unit suites, 414/414 unit tests, and 5/5 E2E suites, 26/26 E2E tests green**.
- Persistent user-context foundation was validated: **UserContextService 2/2 tests green**, **BrainStateService 1/1 test green**, **backend typecheck green**, **backend build green**.
- Current multilingual implementation adds a global locale capability registry and language-picker catalog, but **this is not yet proof of full multilingual understanding**.

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

## Current implementation direction

### Global Voice + Multilingual Understanding

```text
Microphone
   ↓
Language / locale detection
   ↓
On-device or free-tier STT provider
   ↓
Locale-aware normalization
   ↓
Universal intent / entity understanding
   ↓
Persistent context + memory
   ↓
Deterministic tools / Personal Brain
   ↓
Local response generation
   ↓
On-device / local / free-tier TTS provider
```

The architecture must preserve one internal intent model while allowing language-specific speech recognition, normalization, culturally appropriate phrasing, and TTS voices.

## Working rule

Every work session starts by reading **A and B**, then inspecting the repository. Continue from the **first unchecked item of the current workstream**. When an item becomes green, record the exact validation result in **A** and update **B** when the UX contract changes.