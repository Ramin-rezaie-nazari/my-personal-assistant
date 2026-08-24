# My Personal Assistant — Global Multilingual Voice Roadmap

> **C — Roadmap for the current Global Voice + Multilingual Understanding workstream.**
>
> Fixed file aliases:
> - **A** = `docs/05_CURRENT_STATE.md`
> - **B** = `docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`
> - **C** = `docs/C_GLOBAL_MULTILINGUAL_VOICE_ROADMAP.md`
>
> Rule: C is the detailed execution checklist for this workstream. A and B record the durable project state and UX contract. When every item in C is truly green, migrate the completed outcomes into A/B and then replace C with the roadmap for the next workstream.

## Current baseline

**Starting workstream completion: ~65%**

The deterministic multilingual contract is green: 51 registered locales, 10 selectable voices, multilingual intent tests, mobile voice contract, backend typecheck/build, and mobile typecheck are green. This is not yet proof of unconstrained native-level speech understanding or native-quality speech output.

## Completion model

```text
Semantic Understanding        0–10%   10%
Entity + Context Understanding 10–18%   8%
Multilingual STT Runtime      18–25%   7%
Multilingual TTS Runtime      25–30%   5%
Routing + Offline/Edge        30–34%   4%
Native Responses + Safety     34–36%   2%
Conversation Coverage         36–38%   2%
Real-world Validation         38–40%   2%
Final 100% gate               40%      gate
```

The percentages below describe progress **within this roadmap**, not the whole MYPA product.

## 1. Semantic Multilingual Understanding — 0% / 10%

- [ ] **1.1 Paraphrase engine** — understand multiple natural phrasings of the same intent instead of relying primarily on exact phrase matches.
- [ ] **1.2 Colloquial language** — support contractions, conversational shorthand, slang and incomplete speech patterns per locale.
- [ ] **1.3 Semantic intent ranking** — rank competing intents from semantic evidence rather than first-match ordering.
- [ ] **1.4 Multi-intent requests** — split and plan requests such as “remind me tomorrow and add chicken to the basket”.
- [ ] **1.5 Ambiguity handling** — detect uncertainty and ask one concise clarification instead of guessing.
- [ ] **1.6 Contextual references** — resolve “that”, “the one from yesterday”, “same as before”, etc. from conversation/context.
- [ ] **1.7 Long utterances** — preserve intent/entity meaning across naturally long user speech.
- [ ] **1.8 Negation and conditionals** — understand “don’t”, “unless”, “if”, “only if”, “not anymore”, etc.
- [ ] **1.9 Cross-language semantic equivalence** — keep one internal intent model while allowing locale-specific wording.
- [ ] **1.10 Semantic regression suite** — large paraphrase matrix with positive, negative, ambiguous and adversarial examples.

## 2. Entity + Context Understanding — 0% / 8%

- [ ] **2.1 Date/time extraction** — relative dates, natural times, ranges and locale conventions.
- [ ] **2.2 Quantity/unit extraction** — metric/imperial, local expressions, decimals, fractions and colloquial quantities.
- [ ] **2.3 Food/entity aliases** — locale-specific food names, spelling variants and common colloquial names.
- [ ] **2.4 Person/place/reference resolution** — map named people, places and prior references into structured entities.
- [ ] **2.5 Conversation memory binding** — attach current utterances to recent conversational state.
- [ ] **2.6 Personal Brain binding** — resolve entities against durable profile/preferences/memory without re-asking known facts.
- [ ] **2.7 Confidence model** — separate language confidence, intent confidence and entity confidence.
- [ ] **2.8 Entity regression suite** — representative multilingual tests for dates, units, quantities, foods and references.

## 3. Multilingual STT Runtime — 0% / 7%

- [ ] **3.1 Local/offline STT provider contract implementation** behind the existing replaceable interface.
- [ ] **3.2 Provider capability matrix** per locale/device/runtime.
- [ ] **3.3 Automatic STT fallback** when preferred local capability is unavailable.
- [ ] **3.4 Partial-result handling** for natural streaming speech.
- [ ] **3.5 Noise/timeout/error recovery** without breaking the voice conversation state machine.
- [ ] **3.6 Accent and speech-rate validation** for supported locales.
- [ ] **3.7 Real-device STT matrix** across supported locale families.

## 4. Multilingual TTS Runtime — 0% / 5%

- [ ] **4.1 Local/offline TTS provider** behind the replaceable interface.
- [ ] **4.2 Voice capability matrix** per locale/device/runtime.
- [ ] **4.3 Stable character identity** across locale/provider changes.
- [ ] **4.4 Natural locale pronunciation** including regional phonetics and Persian Tehran identity.
- [ ] **4.5 Streaming/interrupt-safe TTS** integrated with speaking/done states.
- [ ] **4.6 Real-device TTS matrix** for supported locales and selected voices.

## 5. Routing + Offline/Edge Resilience — 0% / 4%

- [ ] **5.1 STT routing policy** — local → edge/free-tier fallback → explicit unavailable state.
- [ ] **5.2 TTS routing policy** — local → edge/free-tier fallback → explicit unavailable state.
- [ ] **5.3 Capability cache** so the app does not repeatedly probe unsupported providers.
- [ ] **5.4 Privacy-aware routing** so voice data only leaves the device when the chosen policy allows it.

## 6. Native Responses + Safety — 0% / 2%

- [ ] **6.1 Language-native response layer** instead of Persian/English-only response templates.
- [ ] **6.2 Locale-aware safety/confirmation phrasing** with one internal action model.
- [ ] **6.3 Preserve friendly tone** while keeping destructive/costly/privacy-sensitive confirmations explicit.

## 7. Conversation Coverage — 0% / 2%

- [ ] **7.1 Full conversation matrix** covering every supported locale.
- [ ] **7.2 Mixed-language conversation cases.**
- [ ] **7.3 Multi-turn reference cases.**
- [ ] **7.4 Recovery after misunderstanding.**

## 8. Real-world Validation — 0% / 2%

- [ ] **8.1 Real development build validation** for microphone, STT, TTS and locale switching.
- [ ] **8.2 Device matrix** across iOS/Android hardware families available to the project.
- [ ] **8.3 Noisy-room / accent / fast-speech validation.**
- [ ] **8.4 Long-form and multi-intent spoken request validation.**

## Definition of 100%

This workstream is **100% complete only when all of the following are true**:

- every checklist item above is green;
- the deterministic multilingual suite remains green;
- semantic/paraphrase coverage is green;
- entity/context coverage is green;
- STT and TTS providers are exercised through the replaceable contracts;
- routing/fallback policies are tested;
- language-native responses are validated;
- real-device speech input and output are validated for the supported locale matrix;
- A and B are updated with the final durable state;
- this file is emptied/replaced with the roadmap of the next workstream.

## Current roadmap status

**0% of C completed at creation.** The previous 65% state is the baseline carried from A/B; C tracks only the remaining work needed to reach the stricter “understands naturally and speaks naturally” goal.
