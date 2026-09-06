# My Personal Assistant — User Experience + Persistent Memory Contract

> **B — Product/UX contract paired with A (`05_CURRENT_STATE.md`).**
>
> A is implementation/progress truth. B defines the intended user-visible behavior and memory contract.

## Product promise

MYPA should feel like one personal assistant, not a collection of disconnected modules. The user should be able to discover food, understand recipes, browse fitness movements, start a workout, receive coaching, log outcomes and ask the Brain for help without learning the internal architecture.

## Default interaction

```text
User speaks or taps
      ↓
Locale + persistent context
      ↓
Intent / navigation / domain request
      ↓
Deterministic domain service
      ↓
Personal Brain when cross-domain reasoning is needed
      ↓
Compact, explainable result
      ↓
Action / coaching / logging
      ↓
Durable memory or outcome update when appropriate
```

Typing remains available as a fallback; voice is a primary interaction target but native runtime validation remains a separate gate.

## Food and recipe UX contract

A global recipe result should expose, where the catalog contains the evidence:

- recipe name and cuisine/context;
- hero image plus an optional image gallery;
- complete ingredient list with quantities and units;
- serving selector with deterministic scaling;
- nutrition when provenance-backed data exists;
- ordered preparation steps;
- optional step-specific instructional images;
- cooking time/temperature metadata when known;
- source, license and attribution metadata without polluting the primary user journey;
- shopping handoff for missing ingredients.

A recipe must never be presented as fully verified when required ingredients, instructions, provenance, safety assertions or media evidence are incomplete.

## Fitness UX contract

Each supported discipline is represented as a ten-level progression scale:

```text
1 Beginner
2 Beginner+
3 Foundation
4 Foundation+
5 Intermediate
6 Intermediate+
7 Advanced
8 Advanced+
9 Expert
10 Elite
```

The catalog target is **500 published movements per discipline**. A movement is release-eligible only when its metadata is valid and at least **four distinct approved WebP demonstration assets** are available.

Each movement should expose:

- name;
- difficulty level;
- focus/muscles or movement intent;
- equipment requirements;
- ordered execution instructions;
- coach cues;
- multiple demonstration images;
- source/license/attribution;
- parent/variant relationship where applicable.

The user should be able to browse, search, open the detailed movement view, see the media sequence and instructions, select a difficulty level, start a session and record completion/progression.

Yoga additionally supports camera-oriented coaching and motion analysis when the device/native runtime is available.

## Memory contract

Stable user facts should be collected once, persisted in structured models and reused through the Personal Brain. The UI should not repeatedly ask for facts that already exist in durable user context.

The Brain may keep richer internal context than the UI exposes. Low-confidence internal details must remain internal unless explicitly safe and useful to surface.

## Media/provenance contract

Every imported content asset must retain enough provenance to answer:

- where it came from;
- which provider/page supplied it;
- which license applies;
- what attribution is required;
- whether it is approved for display;
- whether it was transformed (for example, recompressed to WebP).

Missing or ambiguous licensing is a release blocker, not a warning to be ignored.

## Privacy and offline direction

Core deterministic food/fitness behavior must not require a paid cloud AI provider. Device/local capabilities may be used as fallbacks, while provider-specific adapters remain replaceable.

## Validation boundary

Repository tests prove deterministic behavior and integration contracts. They do not prove native microphone/camera quality, visual UX quality on physical devices, or production-scale content licensing. Those require their own runtime/release gates.
