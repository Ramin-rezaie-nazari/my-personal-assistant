# My Personal Assistant — D1 Real-Device Voice E2E Roadmap

> C = temporary execution roadmap. A=`docs/05_CURRENT_STATE.md`; B=`docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`. D1 is the runtime-validation workstream after the multilingual voice + premium mobile milestone.

## Objective

Certify the real mobile path from language selection and microphone capture through STT, semantic understanding, Personal Brain execution, localized response routing and TTS completion on a real development build/device, without claiming native-level speech quality beyond what is actually observed.

## Execution rules

- Preserve previously green A/B milestones; reopen them only for a real regression.
- Inspect repository contracts before changing implementation.
- Fix repository-side blockers ourselves whenever the available tools permit it.
- Prefer deterministic, vendor-agnostic contracts and explicit runtime diagnostics over hidden fallbacks.
- Separate repository-test certification from real-device/provider certification.
- Run the relevant automated checks in the user's environment when the runtime/device is required; do not claim those checks were executed here.
- Keep evidence in this temporary C file until the workstream is fully validated, then promote durable outcomes into A/B and clear C.

## D1 gates

### D1.1 Repository/runtime readiness — REPOSITORY SIDE IMPLEMENTED
- [x] Verify mobile scripts, Expo/development-build path, environment contracts and voice entry routes.
- [x] Verify microphone permission handling and audio lifecycle/error recovery.
- [x] Verify STT/TTS provider selection, locale mapping and safe fallbacks.
- [x] Verify voice state machine transitions and completion handling (`idle → listening → thinking → acting → speaking → done`).
- [x] Verify runtime cleanup distinguishes listener removal from native recognition abort.
- [x] Add focused regression checks for repository-side gaps discovered during review.
- [x] Make TTS completion timeout-safe so a missing native callback cannot strand the UI in `speaking`.
- [x] Make stored voice IDs self-healing to a known profile.
- [x] Make native on-device speech capability detection report actual device support, not only locale-table membership.
- [x] Isolate sequential voice sessions so stale STT/API/TTS continuations cannot overwrite the active session state.

### D1.2 Real-device smoke path — PENDING DEVICE
- [ ] Run a Persian/Tehran-style voice command on a real development build.
- [ ] Confirm microphone permission and capture.
- [ ] Confirm STT result reaches semantic understanding.
- [ ] Confirm intent/entity/constraint extraction reaches the expected tool/brain action.
- [ ] Confirm localized response routing.
- [ ] Confirm TTS starts, completes and returns the Voice Core to `done`.
- [ ] Repeat with a normal conversational follow-up using prior context.

### D1.3 Representative multilingual device matrix — PENDING DEVICE
- [ ] Persian + RTL.
- [ ] English + LTR.
- [ ] At least one additional RTL locale.
- [ ] At least two additional representative LTR locales.
- [ ] Validate locale switching without rebuilding persistent user data/memory.
- [ ] Validate language-specific STT/TTS locale mapping.

### D1.4 Robustness / runtime regression — PARTIALLY IMPLEMENTED, DEVICE VALIDATION PENDING
- [x] Partial STT result path preserved.
- [ ] Permission denial/retry on device.
- [ ] STT timeout or failure recovery on device.
- [x] TTS failure/completion cleanup is guarded in repository code.
- [x] Recognition cancellation now has explicit native abort semantics.
- [x] Session replacement aborts the previous native recognizer and invalidates stale async continuations.
- [ ] Cancellation/interruption behavior observed on device while listening or speaking.
- [ ] Multi-intent utterance reaching the correct execution boundary on device.
- [ ] Ambiguous request refuses to guess instead of executing a weak match.
- [ ] Reduced-motion behavior remains safe at runtime.
- [ ] RTL layout/accessibility labels remain usable on device.

### D1.5 Evidence + closure
- [ ] Record exact device/build/runtime/provider matrix and observed outcomes.
- [ ] Record failures separately from infrastructure-only CI timeouts.
- [ ] Promote only durable validated outcomes to A/B.
- [ ] Mark D1 complete only when all realistically testable gates are green.
- [ ] Delete this C roadmap after handoff to A/B.

## Repository-side changes in this workstream

- `apps/mobile/lib/speech-recognition.ts`: locale-aware contextual terms and error copy, guarded permission/start failures, explicit native abort semantics, listener cleanup and actual device capability reporting.
- `apps/mobile/lib/voice.ts`: locale-bound voice profiles, defensive stored-profile recovery, timeout-safe TTS completion, synchronous speech failure protection, cleanup that cannot strand the voice state machine.
- `apps/mobile/app/assistant-premium.tsx`: explicit session versioning, stale async continuation guards, native abort on unmount/session replacement, locale-bound STT/TTS flow.
- `apps/mobile/scripts/d1-voice-readiness-check.cjs`: enforces permissions, locale binding, state transitions, session isolation, abort cleanup and TTS safety.
- `apps/mobile/scripts/voice-quality-check.cjs`: enforces multilingual voice contracts plus abort-safe STT and timeout-safe TTS regression guards.

## Deep review evidence

Review 1 — architecture/diff: verified that the repository changes stay scoped to Voice Core readiness and do not intentionally remove Premium UI behavior; session invalidation is applied before state transitions and stale continuations are guarded.

Review 2 — implementation/contracts: verified the recognition handle exposes `stop` vs `abort`, aborted native events are not surfaced as user errors, listeners are cleaned exactly once, TTS has completion callbacks plus a bounded timeout, and the readiness/quality contracts enforce the same invariants.

## Current evidence

Repository changes are committed on `work/global-multilingual-voice-100`. GitHub Actions did not expose a workflow run for the latest repository changes, so automated execution is not claimed here. Real microphone/OS/TTS validation remains the only blocking class of evidence for D1 closure.

## Definition of done

D1 is complete when the real device demonstrates the intended microphone → STT → semantic understanding → deterministic execution → localized response → TTS completion path for the representative locale matrix, with recovery behavior observed for the key failure modes above, and the durable evidence is recorded in A/B.
