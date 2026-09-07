# MYPA Recipe Intelligence Core v2 — Root Architecture Review

Date: 2026-09-07
Branch: `agent/mypa-autonomous-control-plane`
Status: Architecture baseline for implementation; no production schema migration is required by this document.

## Why this review exists

The recipe/media work exposed a structural problem: image retrieval, recipe understanding, classification, nutrition heuristics, country/cuisine logic, and recommendation scoring have been growing as separate scripts and partial engines. That makes failures look local while the real problem is orchestration and ownership.

The current code already contains useful deterministic capabilities, including a provider-agnostic `RecipeContract`, recipe profiles, dietary classification, ingredient intelligence, country relations, and recommendation scoring. However, these capabilities are not yet expressed as one stable Recipe Intelligence Core. The package scripts still expose multiple separate entry points for classification, profiling, country intelligence, ingredients, nutrition, and scoring, while the application also has a canonical Food Operating Loop. This is functional foundation, but it is not yet a single coherent intelligence boundary.

## Pass 1 — architecture review

### 1. Canonical flow

The target flow is:

```text
RAW RECIPE
   ↓
NORMALIZE
   ↓
UNDERSTAND
   ↓
EVIDENCE + CONFIDENCE
   ↓
RECIPE INTELLIGENCE PROFILE
   ↓
HARD CONSTRAINT FILTER
   ↓
SOFT PREFERENCE SCORING
   ↓
DIVERSIFICATION / NOVELTY
   ↓
EXPLANATION
   ↓
DECISION / RECOMMENDATION
   ↓
USER OUTCOME
   ↓
BOUNDED LEARNING
```

The image system is deliberately outside this core:

```text
Recipe Intelligence Core
        │
        └── media requirement
                  ↓
            Image Resolver
                  ├── existing verified asset
                  ├── licensed/source asset
                  ├── Google Images
                  ├── Bing Images
                  ├── future provider(s)
                  └── unresolved queue
```

The image resolver may consume recipe understanding (name, dish type, cuisine, ingredients) to improve query construction, but it must never modify the recipe's semantic profile.

### 2. Recipe Understanding Profile

The durable profile should become the single semantic snapshot consumed by recommendation and product features. It should cover:

- canonical/localized names
- cuisine / country / region evidence
- dish type and meal slots
- ingredients and normalized ingredient identities
- ingredient roles and substitutions
- dietary suitability and allergen signals
- nutrition values plus nutrition confidence
- prep/cook/total time and confidence
- difficulty and complexity
- techniques and equipment
- batch-friendly / make-ahead / one-pot signals
- provenance/source/version
- evidence items supporting each derived field

A boolean flag is not enough for uncertain food intelligence. Every derived fact should have a value plus confidence and evidence.

### 3. Constraints vs preferences

The recommendation layer must separate non-negotiable safety/compatibility from ranking preference.

Hard constraints:

- explicit allergy or ingredient exclusion
- explicit dietary incompatibility when evidence is strong enough
- unusable/invalid recipe state
- missing mandatory recipe structure

Soft preferences:

- calorie target
- protein target
- preferred cuisine
- available ingredients
- prep time
- difficulty
- variety/novelty
- cuisine/cultural preference
- quality

A recipe failing a hard constraint is filtered out. A recipe missing a soft preference is merely scored lower.

### 4. One recommendation owner

`FoodOperatingLoopService` remains the domain execution/orchestration owner for food decisions. The existing recommendation scoring logic should be moved toward a reusable pure scoring engine instead of creating another parallel recommendation implementation.

The future boundary is:

```text
FoodOperatingLoopService
      ↓
Recipe Intelligence Core
      ├── profile repository
      ├── constraint evaluator
      ├── scoring engine
      └── explanation builder
```

The mobile app remains a consumer of the authenticated recommendation contract and must not maintain an independent ranking implementation.

### 5. Image Resolver contract

The resolver must operate on candidates, not providers.

```text
resolve(recipe)
  → gather provider candidates
  → normalize candidate metadata
  → download candidate
  → validate bytes + MIME + dimensions + aspect ratio
  → reject obvious thumbnail/proxy/process images
  → rank surviving candidates
  → persist exactly one hero asset
```

Provider failure is not recipe failure. A provider is exhausted only after all candidates returned by that provider have been validated and rejected.

This directly fixes the current failure pattern where Google can return low-resolution image candidates and the previous flow could fail the recipe before trying Bing.

## Pass 2 — adversarial review

### A. Retry storm

Risk: a permanently bad recipe can be attempted on every run.

Decision: failed imports carry an attempt counter. After a bounded number of attempts, the recipe is considered exhausted until an explicit retry mode is selected. This prevents endless daily scraping loops.

### B. Provider coupling

Risk: a Google DOM/layout change could break the whole media system.

Decision: Google parsing is one provider adapter only. Bing and future providers remain independently callable. Core resolution logic must not inspect Google-specific DOM rules.

### C. Thumbnail acceptance

Risk: a provider can return a valid HTTP image that is only a thumbnail.

Decision: validation is based on decoded image dimensions and quality constraints, not URL shape alone. Host-name detection is only an optimization, not the final gate.

### D. Recommendation feedback loops

Risk: the system can learn from its own execution rather than from user outcomes.

Decision: execution success, API success, and recommendation quality are separate signals. Only user outcome evidence can directly teach recommendation quality; learning remains bounded.

### E. Missing data overconfidence

Risk: absent ingredients or incomplete instructions can be interpreted as a positive classification.

Decision: insufficient evidence produces `uncertain`, not `suitable`. Recommendation ranking may apply a data-quality penalty rather than treating missing evidence as truth.

### F. Schema explosion

Risk: every new rule creates a new permanent column/table.

Decision: keep durable canonical recipe data separate from derived intelligence. Prefer versioned profile/evidence records over dozens of fragile boolean columns. Add tables only where they represent a durable domain concept or query requirement.

### G. Backward compatibility

Risk: replacing existing scripts breaks operational workflows.

Decision: introduce the core behind stable contracts first. Existing scripts become adapters/backfills, then can be deprecated after equivalent outputs are verified.

## Final target architecture

```text
                       ┌────────────────────────────┐
                       │      Recipe Intelligence   │
                       │           Core             │
                       ├────────────────────────────┤
                       │ Normalize                  │
                       │ Understand                 │
                       │ Evidence / Confidence     │
                       │ Constraint Evaluation     │
                       │ Preference Scoring       │
                       │ Explanation                │
                       └─────────────┬──────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
        Food Operating Loop     Nutrition               Inventory
              │                  / goals                / shopping
              ▼                      │                      │
        Recommendation              └──────────┬───────────┘
                                              ▼
                                      Personal Brain
                                              │
                                              ▼
                                           Mobile

Media is separate:
Recipe → Image Resolver → provider candidates → validation → one hero
```

## Implementation sequence

1. Freeze the current recipe domain contracts as compatibility boundaries.
2. Extract a pure, provider-independent Recipe Intelligence Core service from the existing recipe rules.
3. Make profile generation deterministic and versioned.
4. Add explicit hard-constraint evaluation.
5. Reuse one pure recommendation scorer and one explanation builder.
6. Connect Food Operating Loop to the core and keep its API contract stable.
7. Move image retrieval behind an Image Resolver adapter contract.
8. Make provider exhaustion, retry budgets, provenance, and candidate validation first-class.
9. Backfill and compare outputs against existing scripts on a controlled sample before full-corpus rollout.
10. Only then consider schema additions that are proven necessary by query patterns.

## What is intentionally NOT changing now

- No mass database rewrite.
- No AI provider dependency.
- No generated recipe illustrations.
- No mobile rewrite.
- No forced merge to `main`.
- No more image-scraper patching without contract-level tests.

## Release-quality definition

Recipe Intelligence Core v2 is complete only when:

- the application has one canonical recipe understanding contract;
- hard constraints are separated from preference scoring;
- recommendation explanations are generated from recorded evidence;
- recommendation quality learning is bounded and outcome-based;
- image retrieval is provider-independent and can survive provider failure;
- exactly-one valid hero is auditable for each release recipe;
- every derived intelligence field is traceable to source/evidence/version;
- targeted tests, backend regression, and runtime audits agree with the documented status.
