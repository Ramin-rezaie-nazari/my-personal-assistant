# My Personal Assistant — User Experience + Persistent Memory Contract

> **B — Product/UX contract paired with A.**
>
> Fixed file aliases:
> - **A** = `docs/05_CURRENT_STATE.md`
> - **B** = `docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`
> - **C** = `docs/C_GLOBAL_MULTILINGUAL_VOICE_ROADMAP.md`
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
Understand intent + entities
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

## Global language architecture boundary — current green milestone

The multilingual foundation is now **fully green for its defined deterministic engineering contract**:

- **51 registered locales** in the global voice registry.
- **10 selectable voice profiles** with stable character identity.
- Locale-aware STT/TTS mapping, RTL policy and Tehran-style Persian behavior.
- Semantic understanding foundation with paraphrase recovery, intent ranking, ambiguity refusal and multi-intent clause splitting.
- Entity/context regression foundation: **5/5 tests passed**.
- Multilingual voice quality matrix: **5/5 tests passed**, including 51-locale reminders, representative meal/nutrition/basket/cancellation intents, code-switching, determinism and reminder-vs-dinner disambiguation.
- Full backend Jest validation: **160/160 suites, 432/432 tests passed**.
- Backend typecheck and build green.
- Mobile voice-quality contract and mobile typecheck green.

This is a durable engineering milestone, not a claim of native-level understanding of arbitrary human speech. Real-device speech quality, deeper semantic coverage, native response quality, fallback/privacy routing and full conversation coverage remain future gates.

## Current implementation boundary

The persistent-context layer and voice-first shell are established. The deterministic multilingual foundation is green and should not be reopened unless later architecture/behavior changes invalidate it. The next stage is deeper semantic understanding, richer entity/context handling, local/offline provider routing and real-world speech validation.

## Progress rule

When an item becomes truly green, record its durable result in A and update B when the user-visible UX contract changes. C is temporary execution state; after a workstream milestone is complete, move the verified outcomes into A/B and replace C with the next roadmap.
