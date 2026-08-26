# My Personal Assistant — User Experience + Persistent Memory Contract

> **B — Product/UX contract paired with A.**
>
> Fixed file aliases:
> - **A** = `docs/05_CURRENT_STATE.md`
> - **B** = `docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`
>
> Every work session reads A and B first.

## Goal

The product should expose a simple, lively, premium interface while hiding a much larger internal system.

Default interaction:

```text
User speaks naturally
        ↓
Detect language / locale
        ↓
Understand intent + entities + constraints
        ↓
Load persistent context + relevant memory
        ↓
Decide / plan / execute
        ↓
Respond naturally in the active language
        ↓
Show a compact, animated result
        ↓
Remember durable facts when appropriate
```

Typing/manual entry remains a fallback, not the primary interaction model.

## Global multilingual voice principle

MYPA is global. A user should be able to choose a language once and then speak naturally in that language. One internal intent/tool system must serve many languages without duplicating business logic.

Language, country, region, timezone, units, currency, RTL direction, STT locale and TTS locale are independent concepts. Regional variation must be preserved; Persian for Iran uses a Tehran-style conversational identity.

## Remember-once principle

Stable facts and preferences are collected when needed, persisted in structured profile/preferences, and injected into the Personal Brain through `UserContextService`.

Ask again only when the fact is missing, stale/contradicted, or explicitly changed. Prefer natural conversation over long forms.

## Source precedence

1. Explicit current user statement.
2. Structured persistent profile/preferences.
3. Durable memory with confidence/recency.
4. Derived inference.

Derived inference must never silently overwrite an explicit structured fact.

## Voice interaction contract

Voice is the primary interaction layer. The assistant behaves like a continuous personal companion.

```text
Idle → Listening → Thinking → Acting → Speaking → Done
```

Animation communicates state and must be responsive and purposeful. Voice profiles are persistent and vendor-agnostic. The baseline product has 10 selectable character profiles: 5 feminine and 5 masculine, with stable identity across TTS providers.

## UX constraints

- Voice-first and conversation-first.
- Manual entry is fallback only.
- Show only information needed for the current decision.
- Core tasks should be completable without navigating through feature screens.
- Animation communicates state; it is not decoration.
- Command center is a living summary, not a form-heavy dashboard.
- Complex operations should collapse into one conversational request and one concise result.
- Confirm only destructive, irreversible, privacy-sensitive or costly actions.
- Language/country selection is remembered and reused.
- Switching language must not rebuild user data, memories or plans.

## Context available to the Brain

`UserContextService` provides profile basics, nutrition and diet goals, health/fitness goals, water/sleep targets, language/timezone, notification/reminder preferences, active life areas, stable constraints and relevant remembered facts.

Downstream decision/planning/recommendation/response layers should not repeatedly ask for the same stable facts.

## Deep multilingual semantic + constraint UX contract — completed repository milestone

The assistant should tolerate natural conversational speech instead of requiring exact command wording. For the implemented semantic layer, this includes colloquial paraphrases, common spoken contractions/fillers, short/incomplete utterances where intent can still be established safely, and natural multi-clause requests.

Follow-up language such as “that”, “the same one”, previous-item references, relative dates/times and simple confirmations/negations can bind to the active conversational context. The binding must preserve explicit current-user wording and must not silently replace stored facts.

The understanding layer can also extract structured constraints from natural language, including conditions, negation, dates, dietary constraints, quantities, units, clock time, duration and simple budgets, while normalizing Persian and Arabic digits where applicable. Contradictory add/remove style requests must remain detectable instead of being silently executed as a guess.

When a request remains semantically ambiguous, the assistant should refuse to guess and ask for clarification rather than execute a weak match. This remains a core safety rule.

The internal intent model remains language-agnostic. Locale-specific understanding, normalization, constraint vocabulary and response phrasing may vary, but business logic, memory and plans are not duplicated per language.

## Global language architecture boundary — repository milestone green

The repository-side multilingual voice and semantic foundation is **fully green for its defined engineering scope**:

- **51 registered locales** in the global voice registry.
- **10 selectable voice profiles** with stable character identity.
- Locale-aware STT/TTS mapping, RTL policy and Tehran-style Persian behavior.
- Semantic understanding with paraphrase recovery, safer normalization/scoring, intent ranking, ambiguity refusal and multi-intent clause splitting.
- Context-aware follow-ups for prior references, operations, quantities, relative time/date and confirmation/negation signals.
- Structured multilingual constraint extraction for conditions, negation, dates, diet, quantities, units, time, duration and budgets.
- Entity/context regression foundation: **5/5 tests passed**.
- Multilingual voice quality matrix: **5/5 tests passed**, including 51-locale reminders, representative meal/nutrition/basket/cancellation intents, code-switching, determinism and reminder-vs-dinner disambiguation.
- Full backend Jest validation: **162/162 suites, 475/475 tests passed**.
- Mobile voice-quality contract: **51 locales / 10 voice profiles passed** with STT/TTS mapping, RTL policy, Persian Tehran style and safe TTS completion.
- Mobile TypeScript validation completed with **no TypeScript errors surfaced**.
- Final deterministic repository verification: **D1 FINAL REPOSITORY VERIFICATION PASS**.

This is a durable engineering milestone, not a claim of native-level understanding of arbitrary human speech. Real-device speech quality, local/offline provider routing, accent/noise robustness, fully language-native responses and full end-to-end conversation coverage remain separate gates.

## Premium voice-first interaction layer — completed repository milestone

The repository-side UX implementation is now also a durable contract:

- Premium design tokens, shared surface/glow/result primitives, spacing, typography and motion foundation are established.
- Reduced-motion behavior is protected at shared interaction primitives.
- The Voice Core exposes `idle → listening → thinking → acting → speaking → done` and remains a semantic/tappable interaction.
- The persistent assistant dock is centered on Today / MYPA Core / Settings and respects RTL-aware accessibility behavior.
- Command Center and Assistant are assistant-first, with execution moments and compact follow-up actions.
- Feature surfaces for daily life, nutrition/meals, reminders, calendar, shopping, inventory, recipe intelligence, Personal Brain, supplements, yoga, habits, insights, language, auth, onboarding, settings, meal builder, price intelligence, smart meals and meal detail share the premium visual language.
- Known direct feature routes are premium implementations or explicit shell/entry exceptions, with UI drift detection enforced by the UI Quality Contract.
- Voice Quality Contract and UI Quality Contract provide deterministic regression protection for locale/voice coverage, route wiring, RTL behavior, reduced motion and Voice Core semantics.
- Startup entrance was shortened and the implicit English Voice Core hint was removed so Persian/global UI does not silently mix copy.

### Latest repository validation — green

- **Backend unit tests:** **162/162 suites and 475/475 tests passed**.
- **Targeted multilingual tests:** **20/20 tests passed**.
- **Recipe image pipeline:** **2/2 tests passed**.
- **Mobile TypeScript:** passed.
- **Voice Quality Contract:** PASS — 51 locales, 10 voice profiles, STT/TTS mapping, localized speech context, RTL policy, Persian Tehran style and timeout/cleanup safety.
- **UI Quality Contract:** PASS — premium foundations, route wiring, RTL-aware surfaces, reduced-motion support and tappable Voice Core.
- **D1 Voice Readiness Contract:** PASS.
- **Backend typecheck:** passed.
- **Backend lint:** passed.
- **Prisma generate:** passed.
- **Backend build:** passed.
- **D1 Final Repository Verification:** PASS.

Real-device interaction, native speech quality, provider-dependent behavior, visual review on real hardware and accessibility runtime review remain separate runtime gates.

## Permanent Product North Star / Master Engineering Prompt

> This section is the permanent product-and-engineering direction for MYPA. It must remain durable across workstreams. Temporary task roadmaps belong in C files; this North Star belongs in B and must not be deleted or replaced by milestone-specific planning.

### 1. Vision

MYPA must ultimately become a professional, global, highly intelligent **Personal Operating System**, not an ordinary app.

The goal is one of the most polished, beautiful, alive and intelligent personal assistants, with a smooth, modern, friendly and deeply animated UX. The user's experience should feel like: **“My life really became easier and better because of this app.”**

Over time MYPA combines:

- Personal Assistant
- Nutrition Coach
- Fitness Coach
- Life Planner
- Reminder/Calendar Assistant
- Shopping & Inventory Manager
- Budget/Food Cost Manager
- Personal Brain
- Offline AI Assistant

### 2. Core Brain

The core product intelligence is a **Local / Offline AI Brain** wherever practical.

The Brain should:

- run on-device as much as practical;
- remain usable on weaker phones;
- use modest RAM/CPU;
- perform many useful tasks without internet;
- communicate through voice and text;
- be Persian-first, especially natural Persian and later Tehran-style speech;
- remain vendor-agnostic.

MYPA is not a ChatGPT clone. Intelligence must come from a combination of:

`Deterministic Engines + Structured Data + Rules + Retrieval + Memory + Personalization + Decision Systems + Tool Calling + Local Model + Optional Cloud/External AI`

The user should not feel like the system is merely “offline” or weak.

### 3. Voice

Voice is a first-class product capability. The user should be able to speak naturally and MYPA should understand the request, use context, decide, execute and respond with speech.

Example intent:

> “For this month, for four people, keep food spending below 15 million toman.”

The system should plan against the budget rather than merely echoing the request.

### 4. Nutrition / Food Intelligence

MYPA must become a real **Food Operating System** covering:

- meals;
- calories;
- protein;
- carbohydrates;
- fats;
- fiber;
- dietary restrictions;
- allergies;
- diets;
- taste/preferences;
- budget;
- household inventory;
- household size;
- country/culture;
- user goals.

Food planning must combine budget + inventory + goals + preferences and produce meals, shopping deltas, costs and alternatives when budget limits are threatened.

### 5. Recipe Intelligence

The system already has more than 13,000 recipes and is intended to scale toward approximately 195 countries/cultures.

Recipe intelligence must:

- scale recipes correctly for different serving counts;
- avoid naive linear multiplication where a scaling policy/unit/batch/food type matters;
- prevent duplicate recommendations;
- group/resolve similar dishes intelligently;
- understand country/cuisine/culture;
- honor allergy, vegan, vegetarian and other dietary constraints;
- incorporate household inventory;
- incorporate budget;
- incorporate nutrition goals.

### 6. Globalization

MYPA must be global from the architecture level:

- languages;
- countries;
- food cultures;
- units;
- currencies;
- timezones;
- locales.

Language and country selection are first-class user preferences. Regional differences must influence recommendations rather than merely translating strings.

### 7. Price / Shopping / Inventory

MYPA must eventually maintain household inventory, consumption, shopping lists, recipe-to-shopping conversion, estimated purchase cost, shortage detection and current prices.

The future architecture should support multiple price sources and scheduled jobs (for example around 03:30 when appropriate) that refresh prices. No single vendor should become a single point of failure.

### 8. Fitness

Fitness must support multiple training systems and eventually hundreds of exercises per system.

Exercise data should ideally cover:

- name;
- explanation;
- multiple images;
- video;
- muscle group;
- difficulty;
- equipment;
- contraindications;
- execution cues.

The planner must adapt to the equipment the user actually owns (for example, two dumbbells) and should be able to explain what additional equipment would materially improve the program.

### 9. Camera Coaching

Future direction: front camera + local computer vision / pose estimation.

During exercise, MYPA should be able to analyze movement, recognize form and provide real-time cues such as “raise your left hand slightly.” The target experience is close to having a personal coach beside the user.

### 10. Health / Lifestyle

MYPA should progressively unify:

- water;
- sleep;
- exercise;
- nutrition;
- weight;
- goals;
- supplements;
- medications;
- reminders;
- calendar;
- daily tasks;
- habits;
- life tasks.

Wearable/device integrations must use one internal health model so no single hardware/vendor becomes architectural truth.

### 11. Central AI Decision Layer

The long-term coordination model is:

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
Nutrition | Food | Fitness | Health | Shopping | Finance | Life
    ↓
Local Brain / Free AI Router
```

All major domains should eventually coordinate through one central Brain rather than growing as isolated feature silos.

### 12. AI Cost Philosophy

AI cost should be driven toward zero wherever practical.

Never make the architecture depend on one external AI API. When cloud AI is useful, support:

- multiple providers;
- free tiers;
- fallbacks;
- health checks;
- automatic switching.

A depleted quota on one provider must not make MYPA unusable. Deterministic and local intelligence should replace cloud calls whenever possible.

### 13. Subscription Ready

The product is free today, but the architecture must be subscription-ready from the beginning so Free / Premium / Pro can be introduced later without redesigning the core.

### 14. UX / UI

The product should be:

- premium;
- modern;
- alive;
- friendly;
- extremely responsive;
- animated;
- simple in use;
- powerful underneath.

Complexity should stay behind the UX. The goal is not merely that features work, but that the user enjoys returning every day.

### 15. Preferred Technology / Security

Preferred stack:

- React Native
- Expo
- TypeScript
- Node.js / TypeScript
- PostgreSQL / Supabase
- Supabase Auth / Storage
- Expo Notifications
- future STT/TTS providers
- local/on-device AI where practical

Security and architecture requirements:

- no API keys inside the mobile app;
- privacy matters;
- scalable architecture;
- extensible backend/business logic.

### 16. Development Rules

Every session must:

1. Read A and B.
2. Inspect the repository.
3. Do not rebuild green items without a reason.
4. Continue from the first unchecked item in the current workstream.
5. Check architecture/database/security dependencies before changes.
6. Review important changes at least twice for architecture and side effects.
7. Continue solving problems rather than stopping at the first blocker.
8. Ask the user only for work that genuinely requires the user's device/VS Code/runtime.
9. Test relevant changes.
10. Avoid pointless reruns of already-green work.
11. Record green milestones in A.
12. Keep the progress representation current.

Required lifecycle:

`Implement → Test → Fix → Retest → Mark Green`

### 17. Source of Truth

`docs/05_CURRENT_STATE.md` is the canonical progress source of truth.

A and B together are the durable project memory:

- **A:** current state, milestones, progress, next unchecked work and validation evidence.
- **B:** product UX/memory contract plus the permanent Product North Star / Master Engineering Prompt.

### 18. Testing Philosophy

Do not optimize only for a green unit-test count. Validation should evolve across:

- unit;
- integration;
- e2e;
- database;
- build;
- typecheck;
- lint;
- mobile export/build;
- architecture consistency.

When a test fails, find the root cause rather than muting/deleting the test.

### 19. Product Scale / Ambition

MYPA must be engineered as a global, large-scale product. Treat scalability, maintainability, observability, security, privacy, reliability, localization, cost efficiency and extensibility as first-class constraints.

### 20. Progress / North-Star Rule

Always preserve the final product direction while working on temporary milestones. A local milestone must never silently redefine the product vision.

Current repository-side engineering maturity is strong, but the final MYPA vision remains much larger. Progress must be judged against the full Personal Operating System vision, not merely against the number of green tests or completed files.

A useful internal distinction is:

- **Repository/software foundation:** substantially advanced.
- **Final MYPA Personal Operating System vision:** still in an early-to-middle construction phase.

The current high-level estimate recorded during the latest project review is approximately **27% of the final product vision**, while repository/software foundation is materially further along. This percentage is directional, not a false precision metric; it must be recalibrated after major domain milestones.

## Final Product Rule

Every future workstream must serve the same final goal:

> **MYPA becomes a global Personal Operating System with a powerful Local AI Brain, exceptional UX, and coordinated Food/Nutrition/Fitness/Life/Health/Shopping/Finance intelligence that genuinely makes the user's life easier.**

Temporary roadmaps may be created in C files. When a milestone closes, only durable truths are promoted into A/B and the temporary C file is cleared for the next workstream.

## Progress rule

When an item becomes truly green, record its durable result in A and update B when the user-visible UX contract changes.