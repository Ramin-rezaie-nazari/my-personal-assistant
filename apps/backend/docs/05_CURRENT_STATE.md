# My Personal Assistant — Current State & Checkpoint Ledger

> **Purpose:** This is the project's living operational memory. Read this file before starting a new work session. It records what has already been designed, implemented, validated, and checkpointed so we do not repeat work or rerun unchanged validation unnecessarily.

## 1. Non-Negotiable Product Vision

My Personal Assistant is intended to become a world-class, deeply personalized lifestyle assistant rather than a generic chatbot.

The product should:

- Feel alive, friendly, polished, fast, animated, and exceptionally easy to use.
- Hide complexity behind a simple UX.
- Put an internal AI brain at the center of the product rather than making the whole app dependent on a single external AI provider.
- Prefer local/offline intelligence whenever practical, with graceful remote fallback only when needed.
- Run smoothly on weak phones through device-aware runtime tiers and tight context/memory budgets.
- Support hands-free interaction, including Persian with a Tehran-style accent, plus a broad multilingual voice system.
- Understand the user's life, preferences, history, goals, environment, country, language, units, budget, household, nutrition, fitness, reminders, habits, shopping, and schedules.
- Proactively monitor useful state and remind the user about meaningful events without becoming noisy or annoying.
- Be designed so paid AI or other paid services are not required for core product operation. External providers must be replaceable and have quota/failover boundaries.
- Be globally usable: language, country, currency, measurement system, local relevance, foods, recipes, prices, and recommendations must not assume Iran.
- Be designed for future subscription/entitlement support without forcing a rewrite of the core architecture.

## 2. Long-Term Capability Map

The full intended product capability set is broader than the currently implemented backend foundation.

### Personal assistant and life management

- Natural-language commands.
- Conversational memory and context.
- Daily planning and command center.
- Calendar, reminders, routines, habits, goals, notifications.
- Medication/supplement reminders and schedules.
- Proactive coaching and decision support.
- Long-term memory, outcome learning, and safe action execution.

### Nutrition and household

- Food and meal logging.
- Calories, protein, carbohydrates, fats, and nutrition targets.
- Personalized diets for different users and goals.
- Budget-aware meal planning.
- Household food budget planning, including family size.
- Inventory/pantry awareness.
- Shopping lists and purchase planning.
- Market-price intelligence.
- Recipe scaling by serving count with correct ingredient quantities instead of naive linear text copying.
- Regional/cultural relevance so a user in Spain, Japan, Mexico, etc. is not given Iran-specific recommendations unless appropriate.

### Fitness

- Multiple training domains such as gym/bodybuilding, calisthenics, yoga, and broader fitness.
- Large exercise catalogs with images/video metadata.
- Equipment-aware workout generation.
- Equipment suggestions when useful, without making purchases mandatory.
- Future camera-based movement analysis and coaching using the device camera.

### Voice and AI

- Offline/local AI where practical.
- Persian voice interaction with Tehran-oriented pronunciation/voice design.
- Multilingual ASR/TTS architecture.
- Local model/runtime selection according to device capability, battery, thermal pressure, and memory budget.
- Provider-agnostic routing with quotas, capability filtering, cooldowns, and failover.
- No single AI provider should become an architectural dependency.

## 3. Current Architecture — Implemented Foundation

The current AI foundation is organized approximately as:

```text
User Request
   │
   ▼
AssistantService
   │
   ├── Local Language Understanding
   │
   ├── Natural Action Execution
   │
   └── contextual fallback for unknown requests
   │
   ▼
AiCoreGatewayService
   │
   ├── PersonalContextService
   │      ├── user
   │      ├── conversation
   │      ├── nutrition
   │      ├── life
   │      ├── globalization
   │      ├── voice
   │      └── globalSettings
   │
   ├── DeviceAwareLocalRuntimeService
   │
   └── AiProviderRouterService
            │
            ├── Local Intelligence Provider
            │       └── Local Intelligence Core
            │
            └── remote/provider abstraction(s)
```

### Core architectural boundaries already implemented

1. **Provider router** — provider capability filtering, preference ordering, quota tracking, cooldown/failover behavior.
2. **AI core gateway** — stable application-facing AI boundary that hides providers from the rest of the application.
3. **Personal context** — unified user-aware context assembly.
4. **Local intelligence core** — lightweight deterministic/contextual intelligence intended to do useful work without a large remote model.
5. **Device-aware local runtime** — selects an execution tier according to device capability and pressure signals.
6. **Runtime context budget** — prevents weak devices from receiving unnecessarily large context.
7. **Globalization context** — resolves language/country/currency/units/timezone safely and rejects malformed locale assumptions.
8. **Voice language profiles** — first-generation multilingual voice profile registry.
9. **Voice context** — derives voice behavior from globalization context.
10. **Persistent global user settings** — stores user-level language/country/currency/measurement/timezone/voice preferences and exposes authenticated endpoints.
11. **Global settings → PersonalContext → AI Gateway** — the user's global configuration now reaches the AI provider request context.

## 4. Globalization and Voice Foundation

The first-generation multilingual voice profile set currently covers:

- Persian — Iran / Tehran
- English — US
- English — UK
- Spanish — Mexico
- French — France
- German
- Mandarin Chinese
- Japanese
- Italian
- Brazilian Portuguese
- Korean
- Arabic — Saudi Arabia
- Arabic — UAE
- Arabic — Egypt
- Hindi — India
- Turkish
- Russian

The architecture keeps language, locale, country, accent, directionality, fallback language, and offline-capable metadata explicit.

**Important distinction:** `offline-capable` here is an architectural capability contract; it does not mean every production-grade ASR/TTS voice model is already bundled in the mobile app.

## 5. Persistent Global User Settings

The current global settings contract supports:

- language
- country
- currency
- measurement system
- timezone
- voice profile

The service supports explicit clearing of a previously stored override. This is important because `null` must be able to mean “remove the user's override” rather than silently restoring the old value through nullish coalescing behavior.

The settings API is authenticated and designed to become the single source for globalization/voice personalization.

Current persistence intentionally uses the existing user-fact infrastructure so the foundation can evolve without forcing repeated schema migrations while the domain contract is still being refined.

## 6. Natural Language / Action Foundation Already Covered

The assistant already has local understanding for several action families, including:

- water logging
- nutrition summary / nutrition queries
- workout updates
- habit cancellation
- supplement updates
- reminder-related commands
- contextual/general assistant requests with fallback behavior

Persian natural-language water logging was hardened for:

- Persian digits
- ASCII digits
- explicit milliliters
- Persian glass quantities
- reminder-vs-logging disambiguation

## 7. Testing Ledger

### Last fully green backend validation recorded in this checkpoint

- **155 / 155 test suites passed**
- **433 / 433 tests passed**
- **Typecheck passed** (`tsc -p tsconfig.json --noEmit`)
- **Build passed** (`nest build` after Prisma generation)

### Particularly important AI/Assistant suites already green

- `assistant.service.spec.ts`
- `ai-provider-router.service.spec.ts`
- `ai-core-gateway.service.spec.ts`
- `personal-context.service.spec.ts`
- `local-intelligence-core.service.spec.ts`
- `local-intelligence.provider.spec.ts`
- `device-aware-local-runtime.service.spec.ts`
- `local-language-understanding.service.spec.ts`
- `voice-language.service.spec.ts`
- `voice-context.service.spec.ts`
- `globalization-context.service.spec.ts`
- `global-user-settings.service.spec.ts`
- `assistant.controller.spec.ts`

### Validation reuse rule

Do **not** blindly rerun the complete test suite at the beginning of every work session.

Before starting work:

1. Read this file.
2. Identify the last green checkpoint.
3. Identify which files/services are about to change.
4. Run focused tests first for the changed area.
5. Run typecheck/build when the change can affect compile-time wiring or application startup.
6. Run the full suite once at the end of a meaningful slice or whenever shared infrastructure has changed.

If code has not changed in a previously validated area, its last green result remains valid as a checkpoint unless a dependency/interface affecting it changed.

## 8. Work Completed vs. Not Yet Completed

### Completed foundation

- [x] Provider-agnostic AI boundary.
- [x] Zero-cost-first provider routing.
- [x] Provider quota/failover contracts.
- [x] Local intelligence core.
- [x] Device-aware runtime tiers.
- [x] Context-budget enforcement.
- [x] Unified personal context.
- [x] Globalization context.
- [x] Multilingual voice profile registry.
- [x] Voice context.
- [x] Persistent global settings service and endpoints.
- [x] Global settings flowing into PersonalContext.
- [x] Global settings flowing into AI provider context.
- [x] Full backend test/build/typecheck checkpoint.

### Not yet complete

- [ ] Real mobile Voice UX.
- [ ] Production offline ASR runtime.
- [ ] Production offline TTS runtime and voice packs.
- [ ] Local model packaging/quantization strategy for real devices.
- [ ] Voice streaming/barge-in/interruption handling.
- [ ] Nutrition intelligence expansion and global food datasets.
- [ ] Budget-aware meal planning with live market data.
- [ ] Recipe scaling engine integrated end-to-end with UI.
- [ ] Inventory/pantry intelligence integrated end-to-end.
- [ ] Fitness exercise catalog at intended production scale.
- [ ] Equipment-aware workout generation end-to-end.
- [ ] Camera-based movement analysis/coaching.
- [ ] Global content relevance and localization across every content domain.
- [ ] Daily automatic market-price ingestion pipeline.
- [ ] Subscription/entitlement layer.
- [ ] Mobile UI/animation system and final design language.

## 9. Recommended Next Work Sequence

The default order should be:

1. Finish global settings UI/client integration.
2. Build the real Voice runtime boundary (ASR/TTS abstractions, streaming, interruption, caching, local/remote failover).
3. Build the local-model runtime boundary and real-device packaging strategy.
4. Expand Nutrition + Budget + Shopping as one connected intelligence slice.
5. Expand Fitness + exercise catalog + equipment awareness.
6. Add camera-based coaching after the workout domain is stable.
7. Complete global content/country relevance.
8. Add entitlement/subscription infrastructure without coupling it to core logic.
9. Build the polished animated mobile experience around the stable backend contracts.

## 10. Daily Start Protocol

At the beginning of each development session:

```text
1. Read 00_PROJECT_OVERVIEW.md
2. Read 05_CURRENT_STATE.md
3. Read 04_ARCHITECTURE_ATLAS.md for repository-wide relationships
4. Check the current git branch and status
5. Locate the first unchecked item in the relevant workstream
6. Inspect existing implementation before adding anything
7. Prefer the smallest coherent slice
8. Add/update tests with the slice
9. Validate only the affected area first
10. Run full validation at the end of the slice
11. Update this file and the related architectural docs
12. Create a checkpoint before switching major workstreams
```

## 11. Checkpoint Policy

Every meaningful slice should end with:

```text
[ ] implementation complete
[ ] focused tests green
[ ] typecheck green when relevant
[ ] build green when relevant
[ ] full suite green for shared/core changes
[ ] documentation updated
[ ] git status clean
[ ] named checkpoint commit
```

A checkpoint is considered trustworthy only after the corresponding tests/build/typecheck and documentation are all green.

## 12. Important Engineering Rules

- Never replace the internal AI architecture with a direct dependency on one external provider.
- Never put provider secrets/API keys in the mobile application.
- Never assume Iran-specific defaults when user country/locale is known to be elsewhere.
- Never treat every AI feature as requiring an LLM; deterministic/domain intelligence should handle predictable tasks first.
- Never make weak devices pay the cost of the strongest model/runtime tier.
- Never silently discard user settings because an API or provider does not support an option.
- Never “fix” a failing test by weakening a correct product contract without reviewing the underlying behavior.
- Before changing a shared contract, inspect all consumers and test fixtures.
- Keep documentation close to the implementation and update the living state ledger after meaningful work.
