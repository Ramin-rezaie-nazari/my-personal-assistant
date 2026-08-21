# Weekly Food Budget Optimizer

## Purpose

Extend Food Decision Brain from single-recipe ranking to deterministic multi-day household food planning.

## Inputs

- monthly food budget
- optional explicit weekly budget
- household family size
- planning horizon: 1..7 days
- meals per day: 1..3
- country context
- goal text
- optional plan currency
- current household inventory
- current verified price observations

## Decision pipeline

```text
Budget + household context
  ↓
Recipe serving scaling
  ↓
Inventory coverage and already-owned quantities
  ↓
Unit-aware verified price evidence
  ↓
Recipe purchase-cost estimate
  ↓
Nutrition fit
  ↓
Affordability
  ↓
Inventory reuse
  ↓
Recipe verification
  ↓
Simplicity
  ↓
Family/repetition penalty
  ↓
Deterministic multi-day selection
  ↓
Budget envelope + confidence
  ↓
Aggregated shopping quantities
```

## Safety / correctness rules

1. Never invent a price.
2. Never multiply a price-per-kg by a gram quantity without converting units.
3. Never mix currencies when the caller explicitly selects a plan currency.
4. Inventory reduces purchase cost only after compatible-unit comparison.
5. Missing price evidence lowers budget confidence; it does not silently become zero cost.
6. Budget optimization is deterministic and explainable.
7. This layer consumes canonical food entities and existing recipe scaling metadata; it does not create a second ingredient taxonomy.

## Current API

`POST /budget-intelligence/weekly-plan`

The controller currently accepts the request values as query parameters for compatibility with the existing API surface.

## Current response concepts

- budget envelope
- planned estimated cost
- remaining estimated budget
- budget confidence
- household context
- planned meals
- price coverage
- already-owned cost
- missing ingredients
- aggregated shopping quantities

## Intentionally not solved yet

The current implementation is a deterministic greedy optimizer, not a mathematical global optimizer. Future iterations should add:

- leftover-aware meal planning
- batch cooking opportunities
- ingredient reuse across neighboring days
- macro distribution across the week
- meal-pattern constraints
- culturally appropriate variety constraints
- production-scale database candidate retrieval
- robust price-unit semantics per market
- full live-price coverage
- shopping basket optimization across multiple recipes
