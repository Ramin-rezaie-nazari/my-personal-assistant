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
█████████████░░░░░░░  ~55%

✅ Existing persistent user context reused by the assistant layer
✅ UX contract: voice-first, low-manual-input, remember-once, purposeful animation
✅ Animated interaction state machine: idle → listening → thinking → speaking → done
✅ Voice-first assistant shell added to the mobile assistant screen
✅ Text input retained only as a fallback path
✅ Ten persistent voice character presets: 5 feminine + 5 masculine
✅ Tehran-style Persian voice identity encoded as a product contract
✅ Voice selection persisted locally and restored automatically
✅ Persian contextual vocabulary supplied to speech recognition
✅ Device TTS response path added through Expo Speech
✅ Voice provider remains replaceable; no paid cloud voice is required by the base flow
✅ Duplicate voice-submit race guarded in the assistant shell
✅ Global voice-language capability registry introduced
✅ Language, region, RTL direction, STT locale and TTS locale are modeled independently
✅ Voice profiles can resolve their locale without coupling character identity to a vendor voice ID
✅ Language picker now exposes the global voice-language catalog
✅ Mobile voice TypeScript issues fixed in the implementation branch
✅ Speech recognition now accepts the selected locale instead of being hard-wired to Persian
✅ Replaceable STT provider contract added
✅ Replaceable TTS provider contract added
✅ On-device speech recognition remains the preferred runtime path when supported by the device
✅ LocalLanguageUnderstandingService now carries detected language + language confidence
✅ Locale-aware deterministic intent lexicons added for the supported global language matrix
✅ Explicit preferred locale can override automatic language detection for code-switched text
✅ Basic multilingual normalization/number/time/meal vocabulary support expanded
✅ Existing AssistantService spec contains a representative native-language reminder matrix
✅ Comprehensive multilingual quality test added for the 51 registered locales, representative core intents, code-switching, determinism and reminder-vs-meal disambiguation
✅ Mobile voice quality contract check added without introducing a new test framework dependency
✅ Mobile voice quality command exposed as `pnpm --filter @my-personal-assistant/mobile voice:quality`
🟡 Local multilingual quality test currently exposes real blockers: test typing, one stale locale-count assertion, code-switching/intent precedence and mobile localized-copy type errors
⬜ Run the corrected comprehensive multilingual AssistantService quality suite locally and get every case green
⬜ Run mobile voice quality contract locally and verify all 51 registered locales + 10 voice profiles
⬜ Run mobile typecheck green after localized-copy and registry type fixes
⬜ Validate multilingual language picker and voice flow on a real development build / device
⬜ Add a tested local/offline STT model provider behind the STT contract
⬜ Add a tested local/offline TTS model provider behind the TTS contract
⬜ Add multilingual local/edge STT capability detection and fallback policy validation
⬜ Add multilingual local/edge TTS capability detection and fallback policy validation
⬜ Expand locale-aware entity extraction for dates, units, food aliases, quantities and colloquial speech across the matrix
⬜ Add country-aware locale and language policy so one language can map to multiple regional behaviors
⬜ Add language-specific safety/confirmation phrasing while preserving one internal intent model
⬜ Make local intent response messages language-native instead of Persian/English-only
⬜ Run a representative conversation matrix covering every supported locale
⬜ Run real-device speech input/output validation for each supported locale where the selected STT/TTS provider reports support
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
✅ Locale-aware recognition adapter
✅ Replaceable STT/TTS contracts
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
- Full backend unit tests passed: **156/156 suites, 414/414 unit tests green**.
- Final local backend validation pass reached **156/156 unit suites, 414/414 unit tests, and 5/5 E2E suites, 26/26 E2E tests green**.
- Persistent user-context foundation was validated: **UserContextService 2/2 tests green**, **BrainStateService 1/1 test green**, **backend typecheck green**, **backend build green**.
- Multilingual implementation now has locale-aware STT routing, replaceable speech-provider contracts, language detection, and deterministic locale-aware intent lexicons.
- The comprehensive quality suite is now explicitly aligned to the **51 registered locales** in the voice registry; it also covers representative intent families, code-switching, determinism and reminder-vs-dinner disambiguation.
- The mobile voice quality contract checks **51 registered locales, 10 selectable voices (5 feminine + 5 masculine), STT/TTS mapping, RTL policy, Tehran-style Persian behavior and safe TTS completion**.
- The latest attempted local gate was **not green**: the quality suite exposed a stale 52-count expectation, tuple-vs-object test typing errors, code-switching intent precedence failures and several mobile `AppLocale` indexing/type errors. These are blockers, not completed work.
- **Important:** no 100% claim is valid yet. Architecture/test coverage is not proof of native-level speech understanding or native-quality speech output. Real device/provider validation is still required before completion.

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
Selected locale / language detection
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
Language-native response generation
   ↓
On-device / local / free-tier TTS provider
```

The architecture must preserve one internal intent model while allowing language-specific speech recognition, normalization, culturally appropriate phrasing, and TTS voices.

## Working rule

Every work session starts by reading **A and B**, then inspecting the repository. Continue from the **first unchecked item of the current workstream**. When an item becomes green, record the exact validation result in **A** and update **B** when the UX contract changes.