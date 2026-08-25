# My Personal Assistant — D1 Real-Device Voice E2E Roadmap

> C = temporary execution roadmap. A=`docs/05_CURRENT_STATE.md`; B=`docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`. D1 is the next runtime-validation workstream after the repository-side multilingual voice + premium mobile milestone was locked.

## Objective

Certify the real mobile path from language selection and microphone capture through STT, semantic understanding, Personal Brain execution, localized response routing and TTS completion on a real development build/device, without claiming native-level speech quality beyond what is actually observed.

## Execution rules

- Preserve all previously green A/B milestones; do not reopen them unless D1 exposes a real regression.
- Inspect the repository and current contracts before changing implementation.
- Fix repository-side blockers ourselves whenever the available tools permit it.
- Prefer deterministic, vendor-agnostic contracts and explicit runtime diagnostics over hidden fallbacks.
- Separate repository-test certification from real-device/provider certification.
- Run full relevant automated checks after implementation changes; surface failures plus final summaries.
- Keep D1 notes/evidence in this temporary C file until the workstream is fully validated, then promote durable outcomes into A/B and clear C.

## D1 gates

### D1.1 Repository/runtime readiness
- [ ] Verify mobile scripts, Expo/development-build path, environment contracts and voice entry routes.
- [ ] Verify microphone permission handling and audio lifecycle/error recovery.
- [ ] Verify STT/TTS provider selection, locale mapping and safe fallbacks.
- [ ] Verify voice state machine transitions and completion handling (`idle → listening → thinking → acting → speaking → done`).
- [ ] Verify runtime diagnostics are sufficient to distinguish permission, STT, semantic, tool, TTS and lifecycle failures.
- [ ] Add focused regression checks for any repository-side gaps discovered during this review.

### D1.2 Real-device smoke path
- [ ] Run a Persian/Tehran-style voice command on a real development build.
- [ ] Confirm microphone permission and capture.
- [ ] Confirm STT result reaches semantic understanding.
- [ ] Confirm intent/entity/constraint extraction reaches the expected tool/brain action.
- [ ] Confirm localized response routing.
- [ ] Confirm TTS starts, completes and returns the Voice Core to `done`.
- [ ] Repeat with a normal conversational follow-up using prior context.

### D1.3 Representative multilingual device matrix
- [ ] Persian + RTL.
- [ ] English + LTR.
- [ ] At least one additional RTL locale.
- [ ] At least two additional representative LTR locales.
- [ ] Validate locale switching without rebuilding persistent user data/memory.
- [ ] Validate language-specific STT/TTS locale mapping.

### D1.4 Robustness / runtime regression
- [ ] Partial STT result handling.
- [ ] Permission denial/retry.
- [ ] STT timeout or failure recovery.
- [ ] TTS failure/completion cleanup.
- [ ] Cancellation/interruption during listening or speaking.
- [ ] Multi-intent utterance reaching the correct execution boundary.
- [ ] Ambiguous request refuses to guess instead of executing a weak match.
- [ ] Reduced-motion behavior remains safe at runtime.
- [ ] RTL layout/accessibility labels remain usable on device.

### D1.5 Evidence + closure
- [ ] Record exact device/build/runtime/provider matrix and observed outcomes.
- [ ] Record failures separately from infrastructure-only CI timeouts.
- [ ] Promote only durable validated outcomes to A/B.
- [ ] Mark D1 complete only when all realistically testable gates are green.
- [ ] Delete this C roadmap after handoff to A/B.

## Definition of done

D1 is complete when the real device demonstrates the intended microphone → STT → semantic understanding → deterministic execution → localized response → TTS completion path for the representative locale matrix, with recovery behavior observed for the key failure modes above, and the durable evidence is recorded in A/B.
