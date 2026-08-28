# My Personal Assistant — Current State

> **A — Single source of truth for project progress.**
>
> Rule: do not rebuild or retest a green item unless a later change invalidates it. Continue from the first unchecked item in the current workstream.
>
> **Fixed file aliases:**
> - **A** = `docs/05_CURRENT_STATE.md`
> - **B** = `docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`
>
> Every work session starts by reading A and B first.

## Current workstream

### Global Voice + Multilingual Understanding

```text
Repository-side deterministic + semantic milestone
████████████████████  100% green

Full end-to-end global voice workstream
███████████████░░░░░  repository implementation complete; external/device gates remain
```

The repository-side scope of the current milestone is complete and fully green. The overall product workstream is not marked 100% until real-device and provider-dependent gates below are actually validated.

### Durable completed milestone — Global Multilingual Voice + Deep Semantic Understanding (repository-side)

Validated on `work/global-multilingual-voice-100`:

- ✅ Global voice-language registry and regional locale model: **51 registered locales** and **10 selectable voice profiles**.
- ✅ Language, country/region, timezone, units, currency, RTL direction, STT locale and TTS locale are independently modeled.
- ✅ Replaceable STT/TTS contracts, device/on-device path, partial-result handling, cleanup/error recovery, voice persistence and Tehran-style Persian policy are implemented.
- ✅ `SemanticMultilingualUnderstandingService` provides semantic understanding above lexical anchors, including paraphrase recovery, semantic ranking, ambiguity refusal and multi-intent clause splitting.
- ✅ Natural/colloquial paraphrase coverage, spoken fillers, common contractions and short/incomplete utterances were strengthened with safer normalization and scoring.
- ✅ Conversational follow-ups retain prior action/resource references, operations, quantities, relative time/date and confirmation/negation signals.
- ✅ Locale-aware response routing uses safe fallbacks without duplicating business logic.
- ✅ Multilingual constraint extraction was strengthened for conditions, negation, dates, diets, quantities, units, time, duration, budgets, Persian/Arabic digit normalization and contradiction detection.
- ✅ Dinner recommendation false-negative fixed in `semantic-multilingual-understanding.service.ts` (commit `169682f`); dedicated multilingual voice suite is **5/5 green**.
- ✅ Entity/context regression foundation: **5/5 tests passed**.
- ✅ Multilingual voice quality matrix: **1/1 suite, 5/5 tests passed**, including 51-locale reminder coverage, representative meal/nutrition/basket/cancellation cases, code-switching, determinism and dinner-recommendation-vs-reminder disambiguation.
- ✅ Full backend Jest validation: **160/160 test suites and 432/432 tests passed**.
- ✅ Mobile voice-quality contract: **51 locales, 10 voice profiles, STT/TTS mapping, RTL policy, Tehran-style Persian behavior and safe TTS completion passed**.
- ✅ Mobile TypeScript typecheck: **no TypeScript errors surfaced; validation completed cleanly**.

**Milestone boundary:** this green result proves the defined repository-side deterministic engineering contract plus the implemented semantic/context/constraint layers under automated validation. It does **not** prove unconstrained native-level speech understanding, native-quality TTS, real-device reliability, accent/noise robustness, local/offline provider readiness or arbitrary full-conversation coverage.

### Durable completed milestone — Premium User Experience + Voice-first Mobile Surface (repository-side)

Validated on `work/global-multilingual-voice-100` and locked after final local validation:

- ✅ Premium design tokens, depth, spacing, typography and shared motion foundation.
- ✅ Reusable `PremiumGlow`, `PremiumSurface` and `PremiumResultCard` primitives.
- ✅ Shared reduced-motion support and motion-safe interaction behavior.
- ✅ Living Voice Core with `idle → listening → thinking → acting → speaking → done` states.
- ✅ Voice Core is a real semantic/tappable interaction, not a visual-only affordance.
- ✅ Persistent assistant dock centered on Today / MYPA Core / Settings, with RTL-aware accessibility behavior.
- ✅ Command Center and Assistant rewritten around the assistant as the primary visual anchor.
- ✅ Daily, nutrition/meals, reminders, calendar, shopping, inventory, recipe intelligence, Personal Brain, supplements, yoga, habits and insights moved to the premium visual language.
- ✅ Language, Auth, Onboarding and Settings aligned with the same premium visual system.
- ✅ Meal Builder, Price Intelligence, Smart Meals and Meal Detail implemented as premium experiences.
- ✅ Known direct feature routes are premium implementations or explicit shell/entry exceptions; UI drift protection is enforced by the UI Quality Contract.
- ✅ Voice Quality Contract and UI Quality Contract added for future regression/drift protection.
- ✅ Startup entrance shortened and the implicit English Voice Core hint removed so Persian/global UI does not silently mix copy.
- ✅ Final mobile validation completed on commit `3856b57aa4588759af26c01efbe6f0bb195fcb27`:
  - **TypeScript:** zero TypeScript errors.
  - **Voice Quality Contract:** PASS — **51 locales, 10 voice profiles**, STT/TTS mapping, localized speech context, RTL policy, Persian Tehran style and safe TTS completion.
  - **UI Quality Contract:** PASS — premium foundations, route wiring, RTL-aware surfaces, reduced-motion support and tappable voice core.

**Workstream boundary:** repository-side UI/voice implementation is complete and green. Real Expo/device smoke testing, visual review on real hardware, accessibility runtime review and provider/device speech-quality validation remain external/runtime gates and are intentionally not claimed here.

## Next unchecked capabilities

The first remaining gates are external/runtime validation rather than unfinished implementation of the completed repository milestones:

- ⬜ Validate multilingual language picker and complete microphone → STT → understanding → TTS flow on a real development build/device.
- ⬜ Validate representative supported locale/provider combinations on real hardware.
- ⬜ Add and validate a local/offline STT model provider behind the existing STT contract.
- ⬜ Add and validate a local/offline TTS model provider behind the existing TTS contract.
- ⬜ Add multilingual local/edge STT capability detection and fallback policy.
- ⬜ Add multilingual local/edge TTS capability detection and fallback policy.
- ⬜ Expand semantic entity extraction further for full-locale date expressions, food aliases, colloquial quantities and broader unit coverage where real usage exposes gaps.
- ⬜ Add country-aware language/locale policy for regional behavior differences beyond the current registry model.
- ⬜ Make every intent response fully language-native across the entire 51-locale matrix.
- ⬜ Run representative end-to-end conversations across all supported locales.
- ⬜ Validate accents, ASR noise, slang, mixed-language speech, ambiguity and long multi-intent utterances on real speech input.
- ⬜ Mark the entire Global Voice + Multilingual Understanding workstream 100% only after all runtime/provider/device gates are truly green.

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
- 🟡 Final external GitHub Actions runner validation remains a separate infrastructure gate
- ⬜ Re-run external GitHub Actions when runner/infrastructure is available
- ⬜ Mark Food Decision Brain 100% only after that external gate is observable green

## Latest validation evidence

### User-side final validation — latest pass

- **Full backend Jest:** **160/160 suites passed, 432/432 tests passed, 0 snapshots, 36.563s**.
- **Mobile voice quality:** **VOICE QUALITY CONTRACT PASS** for **51 locales, 10 voice profiles, STT/TTS mapping, RTL policy, Persian Tehran style and safe TTS completion**.
- **Mobile UI quality:** **UI QUALITY CONTRACT PASS** for premium foundations, route wiring, RTL-aware surfaces, reduced-motion support and tappable voice core.
- **Mobile TypeScript:** completed with **no TypeScript error output**.

### Previous validation evidence

- **Multilingual voice quality:** 1 suite, 5/5 tests passed.
- **Entity/context quality:** 5/5 tests passed.
- **Semantic multilingual regression foundation:** green.
- **Backend typecheck:** green.
- **Backend build:** green.

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
Locale-aware normalization + semantic understanding
   ↓
Universal intent / entity / constraint extraction
   ↓
Persistent context + memory
   ↓
Deterministic tools / Personal Brain
   ↓
Language-native response routing
   ↓
On-device / local / free-tier TTS provider
```

The architecture must preserve one internal intent model while allowing language-specific recognition, normalization, culturally appropriate phrasing and TTS voices.

## Working rule

Every work session starts by reading **A and B**, then inspecting the repository. Continue from the **first unchecked item of the current workstream**. When an item becomes green, record the exact validation result in **A** and update **B** when the UX contract changes.