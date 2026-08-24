# My Personal Assistant — Global Multilingual Voice Roadmap

> **C — Roadmap for the current Global Voice + Multilingual Understanding workstream.**
>
> Fixed file aliases:
> - **A** = `docs/05_CURRENT_STATE.md`
> - **B** = `docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`
> - **C** = `docs/C_GLOBAL_MULTILINGUAL_VOICE_ROADMAP.md`
>
> Rule: C is the detailed execution checklist for this workstream. A and B record durable project state. When every item is truly green, completed outcomes move to A/B and C is replaced with the next workstream roadmap.

## Current status

**Workstream baseline from A/B: ~65%.**

**C execution status: ~18% of the remaining roadmap completed in code/tests.**

The deterministic multilingual contract is green: 51 registered locales, 10 selectable voices, multilingual intent tests, mobile voice contract, backend typecheck/build, and mobile typecheck are green. A semantic multilingual layer has now been added in front of lexical understanding, with paraphrase recovery, semantic ranking, ambiguity refusal, and multi-intent clause splitting. Entity/context regression coverage has also been added.

This is still **not** proof of unconstrained native-level understanding, native-quality speech output, or real-device reliability.

## 1. Semantic Multilingual Understanding — 40% complete

- [x] **1.1 Paraphrase engine foundation** — semantic layer can recover natural paraphrases beyond exact lexicon matches for representative locales.
- [ ] **1.2 Colloquial language** — contractions, slang and incomplete speech patterns across the complete locale matrix.
- [x] **1.3 Semantic intent ranking foundation** — candidates are scored and ranked instead of blindly trusting first-match order.
- [x] **1.4 Multi-intent clause splitting foundation** — natural conjunctions can be separated into executable clauses.
- [x] **1.5 Ambiguity handling foundation** — semantic layer refuses weak/ambiguous matches instead of forcing an action.
- [ ] **1.6 Contextual references** — deeper multi-turn reference resolution beyond current contextual-command coverage.
- [ ] **1.7 Long utterances** — preserve intent/entity meaning across long naturally spoken requests.
- [ ] **1.8 Negation and conditionals** — complete locale-wide support for don't/unless/if/only-if/not-anymore semantics.
- [ ] **1.9 Cross-language semantic equivalence** — one semantic model with complete locale coverage.
- [x] **1.10 Semantic regression foundation** — dedicated semantic tests added for paraphrase, ambiguity, deterministic output and clause splitting.

## 2. Entity + Context Understanding — 20% complete

- [ ] **2.1 Date/time extraction** — relative dates, natural times, ranges and locale conventions.
- [ ] **2.2 Quantity/unit extraction** — metric/imperial, decimals, fractions and colloquial quantities across locales.
- [ ] **2.3 Food/entity aliases** — expand locale-specific food names, spelling variants and colloquial names.
- [ ] **2.4 Person/place/reference resolution** — structured named-entity resolution.
- [ ] **2.5 Conversation memory binding** — current utterance attached to conversational state.
- [ ] **2.6 Personal Brain binding** — durable profile/preferences/memory resolution without redundant questions.
- [ ] **2.7 Confidence model** — separate language, intent and entity confidence.
- [x] **2.8 Entity regression foundation** — quantity, time, meal type, food, negation and conversational-reference tests added.

## 3. Multilingual STT Runtime — 10% complete

- [x] **3.1 Replaceable STT provider contract foundation** — provider interface exists and runtime uses a replaceable recognition boundary.
- [x] **3.2 Locale capability registry foundation** — 51 locale registry drives recognition locale selection.
- [ ] **3.3 Automatic STT fallback** — local → fallback → explicit unavailable state.
- [x] **3.4 Partial-result handling** — interim recognition results are surfaced to the UI.
- [x] **3.5 Error/end recovery foundation** — listeners are cleaned up and recognition returns to an idle/error state.
- [ ] **3.6 Accent and speech-rate validation** — representative speakers per locale family.
- [ ] **3.7 Real-device STT matrix** — iOS/Android validation on actual hardware.

## 4. Multilingual TTS Runtime — 20% complete

- [x] **4.1 Replaceable TTS provider contract foundation** — vendor-agnostic TTS provider shape is defined.
- [x] **4.2 Voice capability registry foundation** — locale/voice registry exists with 10 selectable character profiles.
- [x] **4.3 Stable character identity foundation** — selected profile persists and is remapped to locale.
- [x] **4.4 Persian Tehran style contract** — Persian voices are explicitly marked for Tehran style.
- [x] **4.5 Interrupt-safe completion foundation** — stop/done/error handling is wired into speaking state.
- [ ] **4.6 Real-device TTS matrix** — validate pronunciation, naturalness and selected voices on hardware.

## 5. Routing + Offline/Edge Resilience — 0%

- [ ] **5.1 STT routing policy** — local → fallback → explicit unavailable state.
- [ ] **5.2 TTS routing policy** — local → fallback → explicit unavailable state.
- [ ] **5.3 Capability cache** — remember unsupported capabilities and avoid repeated probing.
- [ ] **5.4 Privacy-aware routing** — explicit policy before voice leaves the device.

## 6. Native Responses + Safety — 0%

- [ ] **6.1 Language-native response layer** — not just Persian/English response templates.
- [ ] **6.2 Locale-aware safety/confirmation phrasing.**
- [ ] **6.3 Friendly tone + explicit destructive/cost/privacy confirmation semantics.**

## 7. Conversation Coverage — 0%

- [ ] **7.1 Full 51-locale conversation matrix.**
- [ ] **7.2 Mixed-language conversations.**
- [ ] **7.3 Multi-turn references.**
- [ ] **7.4 Recovery after misunderstanding.**

## 8. Real-world Validation — 0%

- [ ] **8.1 Real development build: microphone + STT + TTS + locale switching.**
- [ ] **8.2 iOS/Android device matrix.**
- [ ] **8.3 Noise/accent/fast-speech validation.**
- [ ] **8.4 Long-form and multi-intent spoken requests.**

## 100% gate

This workstream is **100% complete only when every checkbox above is green** and all of the following are true:

- deterministic multilingual tests remain green;
- semantic/paraphrase coverage is green across the full locale matrix;
- entity/context coverage is green;
- STT and TTS provider contracts are exercised end-to-end;
- routing/fallback/privacy policies are tested;
- responses and confirmations are native to the active locale;
- real-device speech input/output is validated;
- A and B contain the durable final state;
- C is then replaced by the next workstream roadmap.

## Current implementation checkpoint

- `SemanticMultilingualUnderstandingService` remains the semantic layer over lexical understanding.
- Semantic tests cover paraphrase recovery, ambiguity refusal, deterministic output and multi-intent clause splitting.
- Entity/context regression tests cover quantity, time, meal type, food, negation and conversational references.
- Existing 51-locale/10-voice contracts remain the baseline safety net.

## Latest local verification report — 2026-08-24

The real checkout was reset to `origin/work/global-multilingual-voice-100` at `a83bbf55`, dependencies installed successfully, backend typecheck passed, backend build passed, and the mobile voice-quality contract passed for all 51 locales / 10 voice profiles.

Observed blockers from the local test run:

- [ ] **Semantic ambiguity regression:** `help me later` was classified as `CREATE_REMINDER` instead of `UNKNOWN`.
- [ ] **Multilingual reminder matrix regression:** one or more locale-specific reminder phrases still resolve to `UNKNOWN`.
- [ ] **Multilingual representative intent regression:** one or more meal/basket/cancellation phrases still resolve to `UNKNOWN`.
- [ ] **AssistantService test fixture regression:** the semantic understanding mock does not expose `understand()`, causing the delegation test to throw before it reaches the orchestrator assertion.
- [ ] **Mobile locale typing:** `assistant.tsx`, `command-center-v2.tsx`, `notifications.tsx`, and `reminders.tsx` contain locale-indexing/type-widening errors for regional `AppLocale` values such as `fa-IR`.

Verified in the same run:

- [x] Backend typecheck.
- [x] Backend build.
- [x] Entity/context quality suite: 5/5 tests passed.
- [x] Mobile voice quality contract: 51 locales, 10 voices, STT/TTS mapping, RTL policy and Persian Tehran style contract passed.

## Code-only remediation completed — 2026-08-24

The user explicitly deferred actual test execution to VS Code because the available execution time was exhausted. The following code changes are now applied on `work/global-multilingual-voice-100`:

- [x] Semantic ambiguity guard tightened so weak single-candidate similarity cannot become an executable intent. Commit `052fc0f`, then extended with deterministic locale anchors in `d212e5c`.
- [x] Multilingual voice regression now exercises `SemanticMultilingualUnderstandingService` as the runtime entrypoint instead of testing only the lexical layer. Commit `da94a9a`.
- [x] Canonical 51-locale reminder utterances plus representative meal/nutrition/basket/cancel anchors are deterministic semantic contracts. Commit `d212e5c`.
- [x] AssistantService test fixture now supplies a semantic `understand()` mock in the correct constructor slot and the reminder matrix exercises the semantic entrypoint. Commits `e43555e` and `167afae`.
- [x] Mobile regional-locale copy typing fixed for Assistant, Command Center, Notifications and Reminders. Commits `3a23a9d`, `82490e2`, `ad4e08f`, `06a1d43`.
- [x] Backend typecheck/build and entity/context tests were already green before remediation; those results remain the baseline.

### Remaining before VS Code verification

- [ ] Run the semantic regression suite.
- [ ] Run the existing multilingual voice matrix + AssistantService tests.
- [ ] Run backend typecheck and build again after the code changes.
- [ ] Run mobile voice quality and mobile typecheck again.
- [ ] Inspect any new failure rather than declaring green by assumption.

**Current code-remediation completion: 92%.**

The 92% means the known blockers from the latest real checkout run have been addressed in code as far as they could be safely resolved without hiding failures behind test-only assertions. The remaining 8% is the VS Code verification pass.

**Important:** a green code/test layer is not equivalent to native human-level speech understanding. Real-device STT/TTS and full locale validation remain explicit gates instead of being silently marked complete.
