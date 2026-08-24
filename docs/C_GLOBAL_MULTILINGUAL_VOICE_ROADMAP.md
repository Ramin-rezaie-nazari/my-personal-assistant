# My Personal Assistant — Deep Multilingual Semantic Roadmap

> **C — Temporary execution roadmap for the current Global Voice + Multilingual Understanding workstream.**
>
> A = `docs/05_CURRENT_STATE.md` stores durable project state.
> B = `docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md` stores durable UX/memory rules.
> C stores only the active roadmap. When the roadmap is truly green, verified outcomes move to A/B and C is replaced by the next workstream roadmap.

## Current workstream

### Deep Multilingual Semantic Understanding

**Baseline:** the deterministic multilingual voice foundation is green and the overall Global Voice + Multilingual Understanding workstream is ~65% complete. The remaining work is about making understanding substantially more natural, contextual, safe and real-world robust without weakening the already-green deterministic contract.

**Important boundary:** code completion is not the same as native-level speech quality. Real-device STT/TTS, accents, noise and provider quality remain explicit gates.

## Phase 1 — Colloquial + natural speech

- [ ] Expand natural paraphrase coverage beyond exact phrase anchors for the core assistant intents.
- [ ] Add contractions and common spoken shortcuts for supported semantic locales.
- [ ] Add conversational fillers and incomplete speech normalization where safe (`uh`, `please`, `just`, clipped requests, etc.).
- [ ] Add colloquial meal, reminder, basket, nutrition and cancellation forms across representative locale families.
- [ ] Improve token normalization for apostrophes, punctuation, whitespace, diacritics and script-specific variants.
- [ ] Improve similarity scoring for partial utterances without making weak matches executable.
- [ ] Preserve strict ambiguity refusal and deterministic ranking.
- [ ] Add negative examples where a similar phrase must remain `UNKNOWN`.

## Phase 2 — Context + conversation

- [ ] Preserve prior intent/entity context across turns.
- [ ] Resolve references such as “that”, “the same one”, “the chicken”, “for tomorrow” and prior-item references.
- [ ] Bind follow-up utterances to the active conversation state without duplicating business logic.
- [ ] Recover cleanly after partial misunderstanding while keeping the useful context.
- [ ] Respect explicit current-user statements over stored context and inferred meaning.

## Phase 3 — Long + multi-entity utterances

- [ ] Understand long natural requests containing multiple constraints.
- [ ] Split multi-intent clauses safely and preserve clause ordering.
- [ ] Keep entity ownership attached to the correct clause.
- [ ] Preserve serving count, diet, budget, inventory, meal and timing constraints when multiple appear together.
- [ ] Reject malformed or internally contradictory requests rather than guessing.

## Phase 4 — Negation + conditionals

- [ ] Support `not`, `don't`, `no longer`, `never`, `unless`, `if`, `only if` and locale-specific equivalents.
- [ ] Distinguish direct negation from idiomatic expressions such as “don’t let me forget”.
- [ ] Never turn a negated destructive/costly request into an executable action.
- [ ] Add conditional execution semantics while preserving the single internal intent model.
- [ ] Preserve safe ambiguity refusal when conditions are incomplete.

## Phase 5 — Entity + context extraction

- [ ] Date/time extraction across locale conventions, relative dates and natural times.
- [ ] Quantity/unit extraction for metric, imperial, decimals, fractions and colloquial quantities.
- [ ] Food aliases, spelling variants, regional names and colloquial food names.
- [ ] Person/place/reference resolution where the existing domain model supports it.
- [ ] Bind extracted entities to the correct intent and clause.
- [ ] Separate language confidence, intent confidence and entity confidence.
- [ ] Preserve confidence provenance so downstream actions can require stronger confidence where necessary.

## Phase 6 — Locale breadth

- [ ] Expand semantic/paraphrase coverage across the full 51-locale registry.
- [ ] Cover representative intent families for every locale family, then fill locale-specific gaps.
- [ ] Preserve selected/preferred locale authority during code-switching.
- [ ] Preserve RTL and script-specific normalization behavior.
- [ ] Add region-aware wording only where product behavior genuinely differs by locale/country.

## Phase 7 — Native response readiness

- [ ] Replace Persian/English-only intent responses with locale-native response templates or response strategies.
- [ ] Add locale-native confirmation phrasing for destructive, privacy-sensitive or costly actions.
- [ ] Keep one internal intent model while localizing tone, phrasing and examples.
- [ ] Ensure language switching does not alter stored memory, plans or business logic.

## Phase 8 — Local/edge resilience

- [ ] Test a local/offline STT provider behind the existing provider contract.
- [ ] Test a local/offline TTS provider behind the existing provider contract.
- [ ] Implement local → fallback → explicit unavailable routing.
- [ ] Add capability caching so unsupported speech capabilities are not repeatedly probed.
- [ ] Add explicit privacy-aware routing before speech leaves the device.

## Phase 9 — Real-world speech validation

- [ ] Validate the language picker and voice flow in a real development build.
- [ ] Validate microphone → STT → understanding → TTS end to end on iOS.
- [ ] Validate the same matrix on Android.
- [ ] Validate supported locale/provider combinations on actual hardware.
- [ ] Exercise accent, speech-rate, ASR-noise, slang, code-switching, ambiguity and long-utterance cases.
- [ ] Validate naturalness and pronunciation of the selected voice profiles.

## Phase 10 — Regression + completion gate

- [ ] Semantic regression suite green.
- [ ] Entity/context quality suite green.
- [ ] Multilingual voice quality suite green.
- [ ] Full backend Jest green.
- [ ] Backend typecheck green.
- [ ] Backend build green.
- [ ] Mobile voice quality green.
- [ ] Mobile typecheck green.
- [ ] No regression in reminder-vs-meal precedence.
- [ ] No regression in code-switching locale authority.
- [ ] No regression in ambiguity refusal.
- [ ] No regression in deterministic repeated output.
- [ ] No test-only masking of a real implementation problem.

## Execution rule

Work from the first unchecked item, but continue through all repository-side work that can safely be completed without waiting for real-device validation.

Do not stop between phases because one implementation detail is inconvenient. Resolve it at the implementation layer where possible; only device-only or user-environment validation belongs at the final handoff.

## Validation-output rule

For long test runs, use the compact failure-only output pattern: execute the complete test suite, surface only failures/errors plus the final summary, and do not ask the user to paste large blocks of green output.

## Definition of done

This workstream reaches **100%** only when all repository-side capabilities are implemented and all technical validation is green **and** the real-device/provider gates are actually observed green. A higher percentage must never be claimed merely because code was written.

## Implementation checkpoint — pending verification

The current repository-side implementation pass includes:

- ✅ Semantic paraphrase coverage expanded for 13 representative locales.
- ✅ Colloquial meal/reminder/basket/nutrition/cancel utterances expanded substantially.
- ✅ Spoken filler normalization added for representative locale families.
- ✅ Common English contraction normalization added.
- ✅ Partial/short utterance similarity scoring strengthened with ordered token overlap.
- ✅ Clause splitting expanded to punctuation and multilingual conjunctions for representative language families.
- ✅ Contextual command parsing expanded for multilingual create/update/cancel vocabulary.
- ✅ Multilingual previous-item/reference phrases expanded.
- ✅ Relative date/ordinal/confirmation/negation extraction expanded across representative locale families.
- ✅ Dedicated semantic regression cases expanded for colloquial, incomplete and filler-heavy speech.
- ✅ Contextual-command regression cases expanded for multilingual clauses, relative dates and negated creation requests.
- ✅ Locale-aware assistant response templates added for representative global locales, while retaining safe fallback behavior.
- ✅ Speech-recognition contextual strings are now locale-aware for representative locales instead of using one English/Persian-only list.
- ✅ Mobile voice-quality contract now checks the localized speech-context routing hook.
- ⬜ Runtime validation still pending.
- ⬜ Full backend/mobile regression validation still pending.
- ⬜ Real-device/provider validation still pending.

## Current checkpoint

**Finish repository-side work that can be safely completed without device access, then return to the user only for the final validation pass. Preserve every already-green deterministic contract as a hard regression baseline.**
