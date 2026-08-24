# My Personal Assistant — Global Multilingual Voice Roadmap

> **C — Roadmap for the current Global Voice + Multilingual Understanding workstream.**
>
> Fixed file aliases:
> - **A** = `docs/05_CURRENT_STATE.md`
> - **B** = `docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`
> - **C** = `docs/C_GLOBAL_MULTILINGUAL_VOICE_ROADMAP.md`
>
> Rule: C is the detailed execution checklist for this workstream. A and B record durable project state. When every item is truly green, completed outcomes move to A/B and C is replaced with the next workstream roadmap.

## Current certification status

**Overall workstream: NOT YET 100%.**

The current code has deterministic multilingual intent coverage, a semantic understanding layer, entity/context regression coverage, and an adversarial semantic suite. The remaining certification gap is not cosmetic: we still need broad locale-wide semantic coverage, native response behavior, robust negation/conditionals, end-to-end STT/TTS routing, and real-device speech validation.

The product already treats 51 locales as first-class language capabilities and maintains 10 selectable voice profiles. The current green contract is therefore a strong engineering foundation, but it is not proof of unconstrained native-level conversation. fileciteturn566file0L2-L10

## 1. Semantic Multilingual Understanding — 50% complete

- [x] **1.1 Paraphrase engine foundation** — semantic layer recovers natural paraphrases for representative locales.
- [ ] **1.2 Colloquial language** — contractions, slang, filler words, fragments and informal speech across all 51 locales.
- [x] **1.3 Semantic intent ranking foundation** — candidates are scored and ranked instead of trusting first-match order.
- [x] **1.4 Multi-intent clause splitting foundation** — English, Persian and additional East Asian / European conjunction boundaries are recognized.
- [x] **1.5 Ambiguity refusal foundation** — weak overlap such as “help me later” is explicitly prevented from becoming an action.
- [x] **1.6 Adversarial semantic regression foundation** — ambiguity, deterministic behavior, clause order and speech-corruption tests added.
- [x] **1.7 Single-character ASR repair foundation** — duplicated-character and adjacent-transposition recovery is exercised across the 51-locale reminder matrix.
- [ ] **1.8 Contextual references** — complete multi-turn reference resolution across all locales.
- [ ] **1.9 Long utterances** — preserve meaning across long, naturally spoken requests with subordinate clauses and multiple constraints.
- [ ] **1.10 Negation and conditionals** — complete locale-wide support for don’t / never / unless / if / only-if / not-anymore semantics.
- [ ] **1.11 Cross-language semantic equivalence** — one semantic model with comparable behavior across the full locale matrix, not just representative locales.
- [ ] **1.12 Free-conversation semantic coverage** — distinguish questions, statements, opinions, explanations, jokes, follow-ups and commands without forcing every utterance into an action intent.

## 2. Entity + Context Understanding — 35% complete

- [x] **2.1 Regression foundation** — quantity, time, meal type, food, negation and conversational-reference cases are covered.
- [ ] **2.2 Date/time extraction** — relative dates, natural times, ranges, timezone and locale conventions.
- [ ] **2.3 Quantity/unit extraction** — metric/imperial, decimals, fractions, spoken quantities and locale forms.
- [ ] **2.4 Food/entity aliases** — large locale-specific food vocabulary, spelling variants and colloquial names.
- [ ] **2.5 Person/place/reference resolution** — structured named-entity resolution.
- [ ] **2.6 Conversation memory binding** — bind current language-specific references to prior turns.
- [ ] **2.7 Personal Brain binding** — resolve durable profile/preferences/memory without redundant questions.
- [ ] **2.8 Conflict reasoning** — reconcile contradictory constraints before execution.

## 3. Multilingual STT Runtime — 35% complete

- [x] **3.1 Replaceable STT provider contract foundation.**
- [x] **3.2 Locale capability registry foundation — 51 locales.**
- [x] **3.3 Partial-result handling.**
- [x] **3.4 Error/end recovery foundation.**
- [ ] **3.5 Automatic STT fallback** — local → fallback provider → explicit unavailable state.
- [ ] **3.6 Accent and speech-rate validation** — representative speakers per locale family.
- [ ] **3.7 Noisy-room / microphone validation.**
- [ ] **3.8 Real-device STT matrix** — iOS and Android hardware.
- [ ] **3.9 Locale switching during the same conversation.**

## 4. Multilingual TTS Runtime — 45% complete

- [x] **4.1 Replaceable TTS provider contract.**
- [x] **4.2 Voice capability registry — 10 selectable character profiles.**
- [x] **4.3 Stable character identity and locale remapping.**
- [x] **4.4 Tehran-style Persian policy.**
- [x] **4.5 Interrupt-safe completion foundation.**
- [ ] **4.6 Native pronunciation / prosody validation across supported locales.**
- [ ] **4.7 Real-device TTS matrix.**
- [ ] **4.8 Long-response interruption / resume validation.**

## 5. Routing + Offline/Edge Resilience — 15% complete

- [ ] **5.1 STT routing policy** — local → fallback → unavailable.
- [ ] **5.2 TTS routing policy** — local → fallback → unavailable.
- [ ] **5.3 Capability cache** — stop re-probing known unsupported capabilities.
- [ ] **5.4 Privacy-aware routing** — explicit policy before speech leaves the device.
- [ ] **5.5 Offline degradation tests** — conversation remains understandable and honest when providers disappear.

## 6. Native Responses + Safety — 15% complete

- [ ] **6.1 Language-native response layer** — responses should be written naturally in the active locale, not translated from Persian templates.
- [ ] **6.2 Locale-aware safety/confirmation phrasing.**
- [ ] **6.3 Destructive/cost/privacy confirmation semantics.**
- [ ] **6.4 Native clarification questions for ambiguity.**
- [ ] **6.5 Tone preservation** — friendly, natural and culturally appropriate without pretending certainty.

## 7. Conversation Coverage — 10% complete

- [ ] **7.1 Full 51-locale conversation matrix.**
- [ ] **7.2 Mixed-language / code-switched conversations.**
- [ ] **7.3 Multi-turn references.**
- [ ] **7.4 Recovery after misunderstanding.**
- [ ] **7.5 Topic shifts and free-form follow-up questions.**
- [ ] **7.6 Conversation-level safety and confirmation persistence.**

## 8. Real-world Validation — 0% complete

- [ ] **8.1 Real development build: microphone + STT + TTS + locale switching.**
- [ ] **8.2 iOS/Android device matrix.**
- [ ] **8.3 Noise / accent / fast-speech validation.**
- [ ] **8.4 Long-form and multi-intent spoken requests.**
- [ ] **8.5 Real user conversation sampling without scripted prompts.**

## Adversarial certification suite

The goal is not “make tests green”; the goal is to actively try to make the assistant misunderstand.

### Required failure classes

- ambiguous partial overlap → must refuse rather than guess;
- lexical false positives → short words must not trigger unrelated intents;
- negated commands → must not execute the negated action;
- conditional commands → must not execute a hypothetical request as an immediate command;
- duplicated-character ASR errors → recover where safe;
- adjacent-character transposition → recover where safe;
- long utterances → preserve the primary action and entities;
- multiple intents → preserve clause boundaries and order;
- mixed-language utterances → preferred locale remains authoritative while embedded language is understood;
- conversational references → “that one / same one / previous” resolves to the correct context;
- ambiguity after context → still ask instead of guessing;
- repeated requests → deterministic output;
- unsupported semantics → return a truthful unknown/clarification result instead of hallucinating intent.

### Current adversarial implementation

- `semantic-multilingual-adversarial.spec.ts` exercises the 51-locale reminder matrix for duplicated-character speech corruption.
- Semantic ambiguity refusal now requires materially stronger evidence before converting an unknown request into an actionable intent.
- Semantic clause splitting now includes additional English, Persian, Chinese, Japanese, Korean and European conjunction forms.
- Assistant unit-test dependency wiring has been aligned with the semantic layer so constructor mocks cannot silently call the wrong service.

## 100% certification gate

C must **not** be marked 100% merely because deterministic tests or local CI are green.

C becomes **100%** only when every unchecked item above is green **and**:

1. semantic intent + entity coverage passes across all 51 locales;
2. ambiguity, negation, conditional, typo, noise, slang and long-utterance tests are green;
3. multi-turn context and Personal Brain binding are green;
4. STT and TTS provider contracts are exercised end-to-end;
5. routing, fallback, offline and privacy policies are tested;
6. responses, clarification and confirmations are genuinely native to the active locale;
7. real-device speech input/output has been validated on iOS/Android where supported;
8. unprompted free-form conversations have been sampled and reviewed for false positives and false negatives;
9. A and B contain the durable final state and evidence;
10. C is then replaced by the next workstream roadmap.

## Honest current checkpoint

The current implementation is substantially stronger than the original deterministic phrase-only baseline, but it is **not** yet a defensible claim of “native-level understanding in all languages.” The repository itself correctly distinguishes a green engineering contract from unconstrained speech understanding and real-device/provider validation. fileciteturn568file0L2-L10
