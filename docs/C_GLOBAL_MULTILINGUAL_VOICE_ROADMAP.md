# My Personal Assistant — Next Workstream Roadmap

> **C — Temporary execution roadmap.**
>
> A = `docs/05_CURRENT_STATE.md` stores durable project state.
> B = `docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md` stores durable UX/memory rules.
> C stores only the active roadmap. When this roadmap's work is truly green, its verified outcomes are summarized into A/B and C is replaced again.

## Current workstream

### Deep Multilingual Semantic Understanding

**Goal:** move beyond deterministic phrase anchors while preserving the now-green multilingual foundation.

### Phase 1 — Colloquial and natural speech

- [ ] Contractions, slang, incomplete speech and common spoken shortcuts.
- [ ] Natural paraphrases across representative locale families.
- [ ] Keep ambiguity refusal strict; do not convert weak resemblance into executable actions.

### Phase 2 — Context and conversation

- [ ] Contextual references such as “that”, “the same one”, “for tomorrow”, and previous-item references.
- [ ] Multi-turn intent/entity binding.
- [ ] Recovery after a partial misunderstanding without losing conversation state.

### Phase 3 — Long and complex utterances

- [ ] Long spoken requests with multiple entities and constraints.
- [ ] Multi-intent requests split into safe executable clauses.
- [ ] Preserve entity ownership and ordering across clauses.

### Phase 4 — Negation and conditionals

- [ ] `not`, `don't`, `no longer`, `unless`, `if`, `only if` and equivalent locale-specific constructions.
- [ ] Prevent destructive or costly actions when conditions are not satisfied.

### Phase 5 — Entity/context expansion

- [ ] Date/time extraction across locale conventions.
- [ ] Quantity/unit extraction including metric, imperial, decimals and fractions.
- [ ] Food aliases, spelling variants and colloquial food names.
- [ ] Separate language, intent and entity confidence signals.

### Phase 6 — Full multilingual regression

- [ ] Expand semantic/paraphrase coverage across the 51-locale matrix.
- [ ] Preserve reminder-vs-meal precedence, code-switching authority and deterministic output.
- [ ] Run full backend validation after implementation changes.

## Definition of done

- Semantic regression suite green.
- Entity/context quality suite green.
- Multilingual voice quality suite green.
- Full backend Jest green.
- Backend typecheck and build green.
- No regression in ambiguity refusal, reminder-vs-meal disambiguation, locale authority or determinism.
- Any real failure is fixed at the implementation layer rather than hidden in tests.
- Validation reports use the compact failure-only output pattern for long test runs.

## First task

Start with **Phase 1: colloquial and natural speech coverage**. Do not reopen already-green foundation behavior unless a new change invalidates it.
