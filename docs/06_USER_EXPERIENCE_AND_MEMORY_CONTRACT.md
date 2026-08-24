# My Personal Assistant — User Experience + Persistent Memory Contract

## Goal

The product should expose a very simple, lively, premium interface while hiding a much larger internal system.

The default interaction model is:

```text
User speaks / types naturally
        ↓
Understand intent + entities
        ↓
Load persistent user context + relevant memory
        ↓
Decide / plan / execute
        ↓
Show a compact, animated result
        ↓
Remember durable facts when appropriate
```

The user should not repeatedly fill forms for facts the app already knows.

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

## UX constraints

- Voice-first and conversation-first.
- Manual entry is a fallback, not the default.
- The user should see only the information needed for the current decision.
- Navigation may exist, but core tasks should be completable without navigating through feature-specific screens.
- Animation communicates state (`listening → thinking → acting → done`); it must remain fast and purposeful.
- The command center is a living summary, not a dashboard full of forms.
- Complex operations should collapse into one conversational request and one concise result.
- Confirmation is required only for destructive, irreversible, privacy-sensitive or costly actions.

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

### Fitness

> «امروز یه تمرین ۳۰ دقیقه‌ای بده.»

The app should use the stored goal, equipment, previous performance and constraints before asking anything new.

### Daily life

> «فردا صبح یادم بنداز آب، مکمل و تمرینم رو انجام بدم.»

The assistant should orchestrate reminders using the existing life context rather than asking the user to open three modules.

## Current implementation boundary

The persistent context hydration layer is complete for the current backend contract. The next UX implementation stage is the visible voice-first shell and its animated interaction-state system, followed by deeper offline voice/model integration.
