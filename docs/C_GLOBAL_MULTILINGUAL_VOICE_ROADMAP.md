# My Personal Assistant — Deep Multilingual Semantic Roadmap

> **C — Temporary execution roadmap for the current Global Voice + Multilingual Understanding workstream.**
>
> A = `docs/05_CURRENT_STATE.md` stores durable project state.
> B = `docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md` stores durable UX/memory rules.
> C stores only the active roadmap. When the roadmap is truly green, verified outcomes move to A/B and C is replaced by the next workstream roadmap.

## Current workstream

### Deep Multilingual Semantic Understanding

**Baseline:** the deterministic multilingual voice foundation is green and the semantic/context implementation pass started from an approximately 65% baseline. Repository-side work is being extended through constraints, entities and provider metadata; real-device/provider gates remain open.

**Important boundary:** code completion is not the same as native-level speech quality. Real-device STT/TTS, accents, noise and provider quality remain explicit gates.

## Phase 1 — Colloquial + natural speech

- [x] Natural paraphrase coverage beyond exact phrase anchors for representative locale families.
- [x] Contractions, spoken shortcuts, fillers and safe incomplete-speech normalization.
- [x] Colloquial meal, reminder, basket, nutrition and cancellation forms.
- [x] Script-aware normalization and deterministic similarity/refusal behavior.
- [x] Negative/ambiguity regression coverage.

**Validation already observed:** backend Jest 160/160 suites and 432/432 tests passed.

## Phase 2 — Context + conversation

- [x] Prior intent/action/resource context across turns.
- [x] Previous-item and Persian reference resolution.
- [x] Follow-up binding through the contextual command layer.
- [x] Repository-side clarification/recovery for ambiguous contextual requests.
- [x] Explicit current-user statements remain authoritative.

**Validation already observed:** backend Jest 160/160 suites and 432/432 tests passed.

## Phase 3 — Long + multi-entity utterances

- [x] Safe clause splitting and clause-order preservation.
- [x] Multi-intent execution remains behind planning/context.
- [ ] Full-locale long requests with many simultaneous constraints.
- [ ] Preserve serving count, diet, budget, inventory, meal and timing ownership across complex clauses.
- [ ] Comprehensive malformed/contradictory long-request refusal.
- [x] Repository-side multilingual constraint extraction contract added for conditions, negation, quantity, units, time, duration and budget.

## Phase 4 — Negation + conditionals

- [x] Representative negation/confirmation behavior.
- [x] Reminder idiom protection such as “don’t let me forget”.
- [x] Existing ambiguity refusal for unsafe contradictory combinations.
- [x] Repository-side condition/negation extraction across the major locale families.
- [x] Repository-side contradiction metadata is now produced by the local provider.
- [ ] Full-locale semantic equivalence for `not`, `don't`, `no longer`, `never`, `unless`, `if`, `only if`.
- [ ] General conditional execution with explicit condition satisfaction checks.
- [ ] Comprehensive protection against negated destructive/costly actions across every supported locale.

## Phase 5 — Entity + context extraction

- [x] Existing quantity/time/meal/food/negation/reference foundation.
- [x] Relative date, ordinal, duration and confirmation signals for representative cases.
- [x] Repository-side metric/imperial quantity + unit extraction with decimals.
- [x] Repository-side time, duration and budget constraint extraction.
- [ ] Broader locale-specific date/time conventions.
- [ ] Fractions and colloquial quantities across all 51 locales.
- [ ] Food aliases, regional names and colloquial food names across the full locale matrix.
- [ ] Robust entity-to-clause binding for long utterances.
- [ ] Separate language, intent and entity confidence with explicit provenance end-to-end.

## Phase 6 — Locale breadth

- [x] Preferred/selected locale authority.
- [x] RTL and script-specific voice registry modeling.
- [x] Representative global semantic/paraphrase support.
- [ ] Full semantic/paraphrase coverage across all 51 locales.
- [ ] Representative intent families for every locale family and locale-specific gap filling.
- [ ] Country/region-aware policy where behavior genuinely differs.

## Phase 7 — Native response readiness

- [x] Representative locale-aware response templates with safe fallback.
- [x] One internal intent/tool model with locale-varying response wording.
- [ ] Fully language-native response coverage across all 51 locales.
- [ ] Native confirmation phrasing for destructive, privacy-sensitive and costly actions.
- [ ] Verify language switching cannot change stored memory, plans or business logic.

## Phase 8 — Local/edge resilience

- [ ] Test local/offline STT provider behind the existing contract.
- [ ] Test local/offline TTS provider behind the existing contract.
- [ ] Implement local → fallback → explicit unavailable routing.
- [ ] Add capability caching for unsupported speech capabilities.
- [ ] Add privacy-aware routing before speech leaves the device.

## Phase 9 — Real-world speech validation

- [ ] Real development-build language picker and voice flow.
- [ ] iOS microphone → STT → understanding → TTS.
- [ ] Android equivalent end-to-end matrix.
- [ ] Actual hardware locale/provider combinations.
- [ ] Accent, rate, ASR noise, slang, code-switching, ambiguity and long-utterance validation.
- [ ] Voice naturalness and pronunciation validation.

## Phase 10 — Regression + completion gate

- [x] Backend regression baseline: 160/160 suites, 432/432 tests passed.
- [x] Mobile voice-quality contract: 51 locales, 10 voice profiles.
- [x] Backend tsconfig excludes `prisma.config.ts`, removing the known typecheck configuration problem.
- [ ] Explicit mobile typecheck zero-exit validation from the user environment.
- [ ] New multilingual constraint/conditional test suite must be executed and remain green.
- [ ] Final all-locale representative conversation matrix.
- [ ] Final real-device/provider matrix.
- [ ] Only then mark the complete workstream 100%.

## Execution rule

Work from the first unchecked item and continue through all repository-side work that can safely be completed without waiting for real-device validation. Do not stop because an implementation detail is inconvenient; solve it in the repository whenever possible. Only device-only or user-environment validation belongs at the final handoff.

## Validation-output rule

For long test runs, execute the complete suite but surface only failures/errors plus the final summary. Do not ask for large blocks of green output.

## Definition of done

This workstream reaches **100% only when repository capabilities are implemented, all technical validation is green, and real-device/provider gates are actually observed green.** Code written without evidence must never be counted as 100%.

## Current checkpoint

**Repository-side constraint extraction is now implemented and wired into the local provider, including conditional/negation/quantity/unit/time/duration/budget metadata and contradiction refusal. The remaining repository work is locale breadth, native responses, offline routing and final matrices. The next user handoff is only for execution of the compact tests/typecheck that cannot be run from the repository connector, followed later by real-device validation.**