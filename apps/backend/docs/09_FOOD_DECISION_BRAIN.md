# Food Decision Brain

## Purpose

This document defines the decision layer that turns a user's food request plus structured personal state into a ranked, explainable set of recipe choices.

It is deliberately downstream of Canonical Ingredient Intelligence. The recommendation layer must not create a second ingredient identity system.

## Decision pipeline

```text
User request
  ↓
Intent / food-theme inference
  ↓
Personal context
  ↓
Hard safety + dietary gates
  ↓
Recipe candidates
  ↓
Serving-aware inventory coverage
  ↓
Nutrition fit
  ↓
Explicit user preference
  ↓
Cuisine / country context
  ↓
Novelty / variety
  ↓
Verification / quality
  ↓
Diversified ranking
  ↓
Reasons + score breakdown + rejected candidates
```

## Global-food rule

Country is a context signal, not a cuisine lock.

A user may live in Iran and request Indian food, seafood, Mexican food, Japanese food, Persian food, or any other cuisine. The decision engine should interpret the requested cuisine independently from the user's market country.

Country context is useful for:

- local recipe discovery
- ingredient availability
- local units
- local substitutions
- future price/budget intelligence

It must not prevent global food discovery.

## Ingredient intelligence dependency

Canonical ingredient identity is owned by the Food Entity / Canonical Ingredient Intelligence layer.

Current upstream capabilities include:

- versioned taxonomy and supplements
- aliases and locale aliases
- canonical redirects
- quantity normalization
- additive quantities
- source-part decomposition
- unknown stable fallbacks
- confidence and review flags

The resolver currently reports `food-entity-resolver-final-v12` on the working branch.

Examples of the contract:

```text
extra virgin olive oil
EVOO
huile d'olive
aceite de oliva
        ↓
canonical olive-oil identity
```

The recommendation engine consumes resolved food/recipe data and must not reimplement canonical identity rules.

## Hard constraints vs soft preferences

Hard constraints are non-negotiable:

- explicit allergy conflicts
- incompatible dietary mode
- invalid user request data
- other future safety policies

Soft signals influence ranking:

- pantry coverage
- nutrition fit
- preferred ingredients
- cuisine/theme match
- novelty
- verification quality
- missing-ingredient convenience

Missing ingredients are normally a penalty, not a blocker. A user can explicitly provide `maxMissingIngredients` when they want strict pantry-first matching.

This distinction is important because a recommendation engine that silently rejects everything requiring a grocery purchase is too restrictive for a general food assistant.

## Current food themes

The current deterministic inference recognizes themes such as:

- seafood
- Indian
- Italian
- Mexican
- Persian/Iranian
- Mediterranean
- Asian
- high protein
- light / lower-calorie
- comfort food

The theme system is intentionally extensible and should eventually be backed by a richer cuisine/region taxonomy rather than an ever-growing regex list.

## Nutrition policy

Nutrition is scored against per-serving targets where available.

The engine should prefer meals that fit the user's calorie and protein targets while avoiding brittle exact-match behavior. Nutrition is a ranking signal unless a future domain policy explicitly defines a hard medical/safety boundary.

Nutrition data must preserve provenance and uncertainty. The system must never invent live nutrition or price values to make a candidate look better.

## Inventory policy

Inventory is evaluated against target-serving quantities produced by the existing Food Operating Loop and Recipe Scaling system.

The engine should prefer candidates that:

1. use what the user already owns;
2. require fewer missing ingredients;
3. remain viable for the requested serving count;
4. hand missing ingredients into Shopping when the user chooses to buy them.

The recipe scaling architecture supports non-linear policies such as `linear`, `sublinear`, `fixed`, `per_batch`, and `manual_review` and must remain the source of truth for serving-aware quantities.

## Variety policy

The final result should not contain ten near-duplicates just because they have similar scores.

Ranking therefore applies family-level diversification near the top of the result set and then fills remaining slots from the next-best candidates.

Future improvements should use canonical recipe families / cuisine clusters rather than only lexical title similarity.

## Explainability contract

Every returned recommendation should expose:

- score
- decision tier
- reasons
- component breakdown
- target serving count
- calories per serving
- protein per serving
- missing ingredients

Rejected candidates should expose a machine-readable reason when practical.

Important rule:

> Explanations must be derived from evidence actually used by the decision process. They must not be generated as post-hoc fiction.

## Safety boundary

Dietary and allergy checks are conservative candidate filters, not medical clearance.

Unresolved ingredient intelligence must remain reviewable. If a future safety-sensitive flow depends on an unresolved ingredient, the system should fail closed rather than assume it is safe.

## Current backend integration

The working branch wires Recommendation Intelligence into the main Nest application.

The food recommendation endpoint is:

```text
POST /recommendation-intelligence/food
```

The service reuses:

- Prisma recipe data
- Food Operating Loop
- Global Country Food service
- Personalization service
- Recommendation Ranking service

This avoids building a parallel recipe/inventory/scaling pipeline.

## Validation expectations

A fully green Food Decision Brain slice requires:

- backend typecheck passes
- backend build passes
- recommendation-engine unit tests pass
- ranking tests pass
- existing food operating loop tests stay green
- existing full Jest suite stays green
- E2E behavior remains green where affected

The user's local environment remains the authoritative final execution environment for tests that require the complete installed workspace.

## Next maturity levels

### Level 1 — current

Deterministic multi-signal ranking with global cuisine intent, hard safety gates, inventory, nutrition, novelty and explainability.

### Level 2

Ingredient-aware cuisine classification using canonical ingredient identities instead of recipe-title heuristics alone.

### Level 3

Budget-aware meal decisions using verified market prices and country currency context.

### Level 4

Multi-meal / weekly optimization balancing nutrition, cost, inventory depletion, variety and user goals.

### Level 5

Outcome learning: measure whether recommendations were actually useful and use high-quality outcome evidence to make bounded future ranking adjustments.

### Level 6

Natural-language intent and voice integration so requests such as:

> «امروز هوس یه غذای هندی خفن کردم، برای ۴ نفر، سبک هم باشه و ترجیحاً بیشتر موادش رو توی خونه داشته باشم.»

become a structured decision request without requiring the user to fill forms.

## Non-negotiable architecture rules

1. Do not create a second canonical ingredient resolver inside recommendation code.
2. Do not treat country as a cuisine restriction.
3. Do not turn soft preferences into hard blockers without an explicit product decision.
4. Do not fabricate price, nutrition, or provenance data.
5. Do not lose serving-scaling metadata.
6. Do not remove explanation evidence from important decisions.
7. Do not silently weaken safety filters to increase recommendation count.
8. Do not duplicate existing Food Operating Loop, Inventory, Shopping, or Recipe Scaling logic.
