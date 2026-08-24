# My Personal Assistant — User Experience + Persistent Memory Contract

> **B — Product/UX contract paired with A.**
>
> Fixed file aliases:
> - **A** = `docs/05_CURRENT_STATE.md`
> - **B** = `docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`
>
> Every work session reads **A and B first**.

## Goal

The product should expose a very simple, lively, premium interface while hiding a much larger internal system.

The default interaction model is:

```text
User speaks naturally
        ↓
Detect language / locale
        ↓
Understand intent + entities in that language
        ↓
Load persistent user context + relevant memory
        ↓
Decide / plan / execute
        ↓
Respond naturally in the user's chosen/current language
        ↓
Show a compact, animated result
        ↓
Remember durable facts when appropriate
```

Typing and manual entry remain fallbacks, not the primary interaction model.

## Global multilingual voice principle

MYPA is a global product. A user should be able to choose a language once and then speak naturally in that language. The assistant must be designed so the same internal intent and tool system can serve many languages without duplicating business logic.

Language, country, region, timezone, units, currency, RTL direction, speech recognition locale and TTS locale are separate concepts and must not be collapsed into one hard-coded language setting.

The experience must support regional variation. For example, Persian for Iran should use a native Iranian/Tehran conversational identity, while another country/language should use an appropriate native locale rather than Persian phrased or pronounced like a foreign-language speaker.

## Remember-once principle

Facts such as age, gender, height, weight, activity level, primary goal, diet type, calorie/protein/water targets, language, timezone, fitness goal and other stable preferences are collected once when needed, persisted in the structured user profile/preferences models, and then injected into the Personal Brain through `UserContextService`.

A later conversation should only ask for a fact again when:

1. the fact does not exist;
2. the fact is stale or contradicted by newer information; or
3. the user explicitly changes it.

The app should prefer a natural question over a long form, for example:

> «هدفت بیشتر چربی‌سوزیه یا عضله‌سازی؟»

and then remember the answer.

## Source precedence

1. Explicit current user statement.
2. Structured persistent profile/preferences.
3. Durable memory with confidence/recency.
4. Derived inference.

Derived inference must never silently overwrite an explicit structured fact.

## Voice interaction contract

Voice is the primary interaction layer. The assistant should feel like a continuous personal companion rather than a button that opens a separate feature.

The interaction states are:

```text
Idle → Listening → Thinking → Acting → Speaking → Done
```

Animation communicates these states and should be fast, responsive and purposeful rather than ornamental.

The voice character system uses persistent, vendor-agnostic profiles. The initial product has ten Persian character choices: five feminine and five masculine. The same character identity must remain stable even when the underlying TTS provider changes.

## UX constraints

- Voice-first and conversation-first.
- Manual entry is a fallback, not the default.
- The user should see only the information needed for the current decision.
- Navigation may exist, but core tasks should be completable without navigating through feature-specific screens.
- Animation communicates state (`listening → thinking → acting → done`); it must remain fast and purposeful.
- The command center is a living summary, not a dashboard full of forms.
- Complex operations should collapse into one conversational request and one concise result.
- Confirmation is required only for destructive, irreversible, privacy-sensitive or costly actions.
- Language and country selection should be remembered and reused across the app.
- Switching language must not require rebuilding user data, memories or plans.

## Context available to the Brain

`UserContextService` now hydrates:

- identity and profile basics;
- age, gender, height, weight, activity level and target weight when available;
- nutrition goals and diet type;
- health / fitness / exercise goals;
- water and sleep targets;
- language, timezone and core notification/reminder preferences;
- active life areas;
- stable constraints;
- relevant remembered facts.

This context is assembled for each Brain request so downstream decision, planning, recommendation and response layers do not need to ask the user for the same information again.

## Product examples

### Food

> «برای امشب یه شام برای چهار نفر بده، گیاهی باشه، زیر بودجه این هفته و چیزای خونه رو هم تا جای ممکن مصرف کن.»

The app should resolve serving count, dietary constraint, budget, inventory and nutrition context without forcing the user through a recipe form.

The same operation must later be possible in every supported language with the same internal intent model.

### Fitness

> «امروز یه تمرین ۳۰ دقیقه‌ای بده.»

The app should use the stored goal, equipment, previous performance and constraints before asking anything new.

### Daily life

> «فردا صبح یادم بنداز آب، مکمل و تمرینم رو انجام بدم.»

The assistant should orchestrate reminders using the existing life context rather than asking the user to open three modules.

## Global language architecture boundary

The global voice-language registry now provides regional locale metadata, RTL metadata, speech-recognition locale and TTS locale. The language picker consumes this catalog rather than hard-coding only Persian and English.

The current multilingual quality gate is green for the defined engineering contract: **51 registered locales**, **10 selectable voice profiles**, **13/13 multilingual Jest tests**, green backend typecheck/build, green mobile voice-quality contract, and green mobile typecheck.

This green gate is an important completion milestone for the deterministic capability foundation. It is **not** the claim that arbitrary human speech in all 51 locales is understood at native level. Full product completion still requires:

- robust speech recognition across real devices and accents;
- deeper semantic/paraphrase understanding beyond the deterministic phrase matrix;
- multilingual speech entity extraction for dates, numbers, units, food aliases, quantities and colloquial language;
- language-native response generation rather than translation-like output;
- tested local/offline or free-tier STT/TTS providers and fallback routing;
- real-device speech input/output validation across supported locales;
- validation under noise, slang, code-switching, ambiguous phrasing and long multi-intent conversations.

## Current implementation boundary

The persistent context hydration layer is complete for the current backend contract. The voice-first shell is implemented. The multilingual capability foundation and deterministic quality contract are green. The next stage is deeper multilingual semantic understanding plus real speech/provider validation, with local/offline STT/TTS remaining behind replaceable provider contracts.

## Progress rule for this contract

When the multilingual quality gate is green, do not reopen the green contract tests unless a later architecture or behavior change invalidates them. Continue from the first unchecked multilingual capability in **A** and keep the distinction between **contract-tested capability** and **real-world native speech quality** explicit.