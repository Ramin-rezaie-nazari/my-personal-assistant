# My Personal Assistant — Deep Multilingual Semantic Roadmap

> **C — Temporary execution roadmap for the current Global Voice + Multilingual Understanding workstream.**
>
> A = `docs/05_CURRENT_STATE.md` stores durable project state.
> B = `docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md` stores durable UX/memory rules.
> C stores only the active roadmap. When the roadmap is truly green, verified outcomes move to A/B and C is replaced by the next workstream roadmap.

## Current workstream

### Deep Multilingual Semantic Understanding

**Baseline:** the deterministic multilingual voice foundation is green and the overall Global Voice + Multilingual Understanding workstream started from an approximately 65% baseline. The current repository-side semantic/context implementation pass is now validated by the full backend regression suite, while device/provider gates remain open.

**Important boundary:** code completion is not the same as native-level speech quality. Real-device STT/TTS, accents, noise and provider quality remain explicit gates.

## Phase 1 — Colloquial + natural speech

- [x] Expand natural paraphrase coverage beyond exact phrase anchors for the current representative locale families.
- [x] Add contractions and common spoken shortcuts for supported semantic locales in the implementation pass.
- [x] Add conversational fillers and incomplete-speech normalization where safe.
- [x] Add colloquial meal, reminder, basket, nutrition and cancellation forms across representative locale families.
- [x] Improve token normalization for apostrophes, punctuation, whitespace, diacritics and script-specific variants in the semantic layer.
- [x] Improve similarity scoring for partial utterances without making weak matches executable.
- [x] Preserve strict ambiguity refusal and deterministic ranking.
- [x] Add negative/ambiguity regression coverage and keep weak matches `UNKNOWN`.

**Phase 1 validation:** full backend Jest **160/160 suites, 432/432 tests passed** after the implementation pass.

## Phase 2 — Context + conversation

- [x] Preserve prior intent/action/resource context across turns in the existing conversation context path.
- [x] Resolve implemented references such as “that”, “the same one”, previous-item references and related Persian forms.
- [x] Bind follow-up utterances to active conversation state through the contextual command layer without duplicating business logic.
- [x] Add repository-side recovery/clarification behavior for ambiguous or contradictory contextual requests.
- [x] Keep explicit current-user statements authoritative over stored context and inference.

**Phase 2 validation:** full backend Jest **160/160 suites, 432/432 tests passed**; contextual regression coverage remains in the backend suite.

## Phase 3 — Long + multi-entity utterances

- [x] Expand safe clause splitting and preserve clause order for representative multilingual conjunctions/punctuation.
- [x] Keep multi-intent execution behind the planning/context pipeline rather than directly executing weak semantic matches.
- [ ] Understand broad long natural requests containing many simultaneous constraints across the full locale matrix.
- [ ] Preserve serving count, diet, budget, inventory, meal and timing ownership across complex clauses.
- [ ] Reject malformed or internally contradictory long requests comprehensively rather than only through the current representative cases.

## Phase 4 — Negation + conditionals

- [x] Preserve direct negation/confirmation signals in contextual command extraction for representative language families.
- [x] Keep idiomatic reminder wording such as “don’t let me forget” from being treated as a cancellation/negated action.
- [x] Preserve ambiguity refusal around unsafe or contradictory creation/cancellation combinations in the current planning layer.
- [ ] Support broad `not`, `don't`, `no longer`, `never`, `unless`, `if`, `only if` equivalents across the full locale matrix.
- [ ] Add general conditional execution semantics with explicit condition satisfaction checks.
- [ ] Add comprehensive protection against negated destructive/costly actions across every supported locale.

## Phase 5 — Entity + context extraction

- [x] Existing entity/context foundation remains green for quantity, time, meal type, food, negation and conversational references.
- [x] Add/retain relative date, ordinal, duration and confirmation signals in the contextual command layer for representative cases.
- [ ] Expand date/time extraction across locale conventions and natural phrasing.
- [ ] Expand quantity/unit extraction for metric, imperial, decimals, fractions and colloquial quantities.
- [ ] Expand food aliases, spelling variants, regional names and colloquial food names.
- [ ] Bind extracted entities robustly to the correct intent and clause across long utterances.
- [ ] Separate language confidence, intent confidence and entity confidence with explicit provenance end-to-end.

## Phase 6 — Locale breadth

- [x] Preserve preferred/selected locale authority in the existing multilingual understanding foundation.
- [x] Preserve RTL and script-specific locale modeling in the voice registry.
- [x] Expand semantic/paraphrase support for a representative global locale set.
- [ ] Expand semantic/paraphrase coverage across the full 51-locale registry.
- [ ] Cover representative intent families for every locale family and fill locale-specific gaps.
- [ ] Add country-aware/region-aware policy where behavior genuinely differs by locale/country.

## Phase 7 — Native response readiness

- [x] Add repository-side locale-aware assistant response templates for representative global locales with safe fallback behavior.
- [x] Keep one internal intent/tool model while response wording varies by locale.
- [ ] Complete fully language-native response coverage across all 51 locales.
- [ ] Add comprehensive locale-native confirmation phrasing for destructive, privacy-sensitive or costly actions.
- [ ] Validate that language switching never changes stored memory, plans or business logic in representative conversations.

## Phase 8 — Local/edge resilience

- [ ] Test a local/offline STT provider behind the existing contract.
- [ ] Test a local/offline TTS provider behind the existing contract.
- [ ] Implement local → fallback → explicit unavailable routing.
- [ ] Add capability caching for unsupported speech capabilities.
- [ ] Add explicit privacy-aware routing before speech leaves the device.

## Phase 9 — Real-world speech validation

- [ ] Validate the language picker and voice flow in a real development build.
- [ ] Validate microphone → STT → understanding → TTS end to end on iOS.
- [ ] Validate the same matrix on Android.
- [ ] Validate supported locale/provider combinations on actual hardware.
- [ ] Exercise accent, speech-rate, ASR-noise, slang, code-switching, ambiguity and long-utterance cases.
- [ ] Validate naturalness and pronunciation of the selected voice profiles.

## Phase 10 — Regression + completion gate

- [x] Full backend Jest green after the latest repository implementation pass: **160/160 suites, 432/432 tests**.
- [x] Mobile voice-quality contract green: **51 locales, 10 voice profiles**.
- [ ] Mobile typecheck explicit zero-exit validation still required; the latest filtered command surfaced no TypeScript error text, but its pipeline exit status was not captured.
- [x] Existing ambiguity/refusal and deterministic regression baselines remain green under the backend suite.
- [ ] Final all-locale representative conversation matrix.
- [ ] Final real-device/provider matrix.
- [ ] Mark the entire Global Voice + Multilingual Understanding workstream 100% only after all remaining gates are truly green.

## Execution rule

Work from the first unchecked item, but continue through all repository-side work that can safely be completed without waiting for real-device validation.

Do not stop between phases because one implementation detail is inconvenient. Resolve it at the implementation layer where possible; only device-only or user-environment validation belongs at the final handoff.

## Validation-output rule

For long test runs, use the compact failure-only output pattern: execute the complete test suite, surface only failures/errors plus the final summary, and do not ask the user to paste large blocks of green output.

## Definition of done

This workstream reaches **100%** only when all repository-side capabilities are implemented and all technical validation is green **and** the real-device/provider gates are actually observed green. A higher percentage must never be claimed merely because code was written.

## Current checkpoint

**Repository-side semantic/context implementation checkpoint is green and documented.** Continue next with the remaining repository-side entity/locale/conditional/provider capabilities; return to the user only when another user-environment/device gate is genuinely required.