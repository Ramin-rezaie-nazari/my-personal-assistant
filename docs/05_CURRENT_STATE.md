# My Personal Assistant — Current State

> **A — Single source of truth for project progress.**
>
> Rule: do not rebuild or retest a green item unless a later change invalidates it. Continue from the first unchecked item in the current workstream.
>
> **Fixed file aliases:**
> - **A** = `docs/05_CURRENT_STATE.md`
> - **B** = `docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`
> - **C** = `docs/C_GLOBAL_MULTILINGUAL_VOICE_ROADMAP.md`
>
> Every work session starts by reading A and B first.

## Current workstream

### Global Voice + Multilingual Understanding

```text
Global Voice + Multilingual Understanding
██████████████░░░░░░  ~65%

Deterministic multilingual foundation: 100% green
Full global voice workstream: NOT complete
```

### Durable completed milestone — Deterministic Multilingual Voice Foundation

Validated on `work/global-multilingual-voice-100`:

- ✅ Global voice-language registry and regional locale model remain the baseline: 51 registered locales and 10 selectable voice profiles.
- ✅ Language, country/region, timezone, units, currency, RTL direction, STT locale and TTS locale remain independently modeled.
- ✅ Replaceable STT and TTS contracts, device/on-device path, partial-result handling, cleanup/error recovery, voice persistence and Tehran-style Persian policy are green.
- ✅ `SemanticMultilingualUnderstandingService` is the semantic layer over lexical understanding, with paraphrase recovery, semantic ranking, ambiguity refusal and multi-intent clause splitting.
- ✅ Entity/context regression foundation is green: quantity, time, meal type, food, negation and conversational-reference coverage — 5/5 tests.
- ✅ Multilingual voice quality matrix is green: 1/1 suite, 5/5 tests, including 51-locale reminder coverage, representative meal/nutrition/basket/cancellation cases, code-switching, determinism and dinner-recommendation-vs-reminder disambiguation.
- ✅ Dinner recommendation false-negative fixed in `semantic-multilingual-understanding.service.ts` (commit `169682f`); the dedicated multilingual voice suite is now 5/5 green.
- ✅ Full backend Jest validation is green: 160/160 test suites and 432/432 tests passed.
- ✅ Backend typecheck and build are green after multilingual fixes.
- ✅ Mobile voice quality contract is green: 51 locales, 10 voices, STT/TTS mapping, RTL policy, Tehran-style Persian behavior and safe TTS completion.
- ✅ Mobile typecheck is green after locale/voice fixes.

**Important boundary:** the green milestone proves the defined deterministic engineering contract. It does **not** prove unconstrained native-level speech understanding, native-quality TTS, real-device reliability, accent/noise robustness or full conversational coverage.

## Next unchecked capabilities

- ⬜ Validate multilingual language picker and voice flow on a real development build/device.
- ⬜ Add tested local/offline STT model provider behind the STT contract.
- ⬜ Add tested local/offline TTS model provider behind the TTS contract.
- ⬜ Add multilingual local/edge STT capability detection and fallback policy.
- ⬜ Add multilingual local/edge TTS capability detection and fallback policy.
- ⬜ Expand semantic entity extraction for dates, units, food aliases, quantities and colloquial language.
- ⬜ Add country-aware language/locale policy for regional behavior differences.
- ⬜ Add language-native safety/confirmation phrasing while preserving one internal intent model.
- ⬜ Make intent response messages language-native instead of Persian/English-only.
- ⬜ Expand semantic/paraphrase coverage beyond deterministic phrase anchors.
- ⬜ Run representative conversations across all supported locales.
- ⬜ Validate real-device speech input/output for supported locale/provider combinations.
- ⬜ Validate accents, ASR noise, slang, mixed-language speech, ambiguity and long multi-intent utterances.
- ⬜ Mark the entire Global Voice + Multilingual Understanding workstream 100% only after all of the above are truly green.

## Previous completed work

### Persistent User Context — 100%

- ✅ Stable profile and preference hydration
- ✅ Brain state normalization
- ✅ Remember-once behavior
- ✅ Source precedence and durable-memory rules
- ✅ User context tests green

### Voice-first Assistant Shell — 100% code-complete

- ✅ Voice-first assistant shell
- ✅ Animated interaction state machine
- ✅ Ten persistent voice character presets: 5 feminine + 5 masculine
- ✅ Tehran-style Persian voice identity
- ✅ Persistent voice selection
- ✅ Persian and locale-aware recognition adapters
- ✅ Replaceable STT/TTS contracts
- ✅ Device TTS response path

### Food Decision Brain — ~99%

- ✅ Prisma schema/client and database foundation
- ✅ Recipe scaling, country/cuisine context, inventory-aware recipe loop
- ✅ Recommendation ranking, personalization and recommendation engine
- ✅ Prior focused/unit/E2E validation recorded in this file before the current workstream
- 🟡 Final external GitHub Actions runner validation remains a separate infrastructure gate
- ⬜ Re-run external GitHub Actions when runner/infrastructure is available
- ⬜ Mark Food Decision Brain 100% only after that external gate is observable green

## Latest validation evidence

- **Full backend Jest:** 160/160 suites passed, 432/432 tests passed.
- **Multilingual voice quality:** 1 suite, 5/5 tests passed.
- **Entity/context quality:** 5/5 tests passed.
- **Semantic multilingual regression foundation:** green.
- **Backend typecheck:** green.
- **Backend build:** green.
- **Mobile voice quality contract:** green for 51 locales / 10 voice profiles.
- **Mobile typecheck:** green.

For long test runs, use the compact failure-only validation pattern: run the complete test suite, but surface only failures/errors plus the final summary.

## Product direction — permanent architectural constraints

MYPA is intended to become a **Personal Operating System**, not a collection of unrelated features.

The central intelligence layer coordinates:

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
- Global product with language, country, locale, units, currency, timezone and culturally relevant guidance.
- Persian-first Tehran-style Persian voice identity for Iran while remaining multilingual.
- Strong offline/local intelligence so the core app remains useful without a paid cloud AI dependency.
- Provider-agnostic AI routing; no runtime dependency on one paid vendor.
- Subscription-ready architecture without requiring payment for core free functionality.
- Inventory-aware food planning, budgets, scalable recipes, nutrition constraints, allergies/dietary restrictions and smart shopping deltas.
- Global recipe intelligence without repeatedly surfacing near-duplicate recipes.
- Equipment-aware fitness with future local/on-device camera coaching where practical.
- One internal health model for wearable/device integrations.
- Stable user facts are remembered once and not repeatedly requested by feature screens.

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

The architecture must preserve one internal intent model while allowing language-specific recognition, normalization, culturally appropriate phrasing and TTS voices.

## Working rule

Every work session starts by reading **A and B**, then inspecting the repository. Continue from the **first unchecked item of the current workstream**. When an item becomes green, record the exact validation result in **A** and update **B** when the UX contract changes.