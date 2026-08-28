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

### D1.1 Repository/runtime readiness — REPOSITORY SIDE COMPLETE
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
- [x] Make assistant network requests timeout-safe and externally cancellable.
- [x] Bound mobile assistant message size and history limits before transport.
- [x] Bound backend assistant input size and validate locale-shaped request metadata.
- [x] Validate confirmation token payloads with a dedicated DTO instead of accepting raw request bodies.
- [x] Verify reduced-motion behavior is wired to system accessibility settings and cancels animation loops safely.
- [x] Improve Voice Orb accessibility semantics for busy state, live status updates and activation hints.
- [x] Audit planning/ambiguity guards: contradictory, low-confidence and partially understood requests are designed to stop rather than guess.
- [x] Create a one-command deterministic final verification gate covering mobile typecheck/quality/readiness plus backend typecheck/unit tests/lint/build.
- [x] Replace hard-coded Persian native permission copy with professional English fallback copy suitable for all locales; localized native dialogs can be added later through Expo locale resource files.

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
- [x] Complete explicit locale propagation from mobile request through backend semantic understanding and response metadata.

### D1.4 Robustness / runtime regression — REPOSITORY COMPLETE, DEVICE VALIDATION PENDING
- [x] Partial STT result path preserved.
- [ ] Permission denial/retry on device.
- [ ] STT timeout or failure recovery on device.
- [x] TTS failure/completion cleanup is guarded in repository code.
- [x] Recognition cancellation now has explicit native abort semantics.
- [x] Session replacement aborts the previous native recognizer and invalidates stale async continuations.
- [x] Assistant network requests have bounded timeout/cancellation semantics.
- [ ] Cancellation/interruption behavior observed on device while listening or speaking.
- [ ] Multi-intent utterance reaching the correct execution boundary on device.
- [ ] Ambiguous request refuses to guess instead of executing a weak match.
- [x] Reduced-motion behavior is protected in repository code.
- [ ] RTL layout/accessibility labels remain usable on device.

### D1.5 Evidence + closure
- [ ] Run the one-command deterministic repository gate in the user's VS Code environment.
- [ ] Record exact device/build/runtime/provider matrix and observed outcomes.
- [ ] Record failures separately from infrastructure-only CI timeouts.
- [ ] Promote only durable validated outcomes to A/B.
- [ ] Mark D1 complete only when all realistically testable gates are green.
- [ ] Delete this C roadmap after handoff to A/B.

## Repository-side changes in this workstream

- `apps/mobile/lib/speech-recognition.ts`: locale-aware contextual terms and error copy, guarded permission/start failures, explicit native abort semantics, listener cleanup and actual device capability reporting.
- `apps/mobile/lib/voice.ts`: locale-bound voice profiles, defensive stored-profile recovery, timeout-safe TTS completion, synchronous speech failure protection, cleanup that cannot strand the voice state machine.
- `apps/mobile/lib/assistant-api.ts`: bounded assistant payloads, cancellable fetches, bounded request timeouts, typed network failure categories and automatic propagation of the stored app locale.
- `apps/mobile/components/AssistantVoiceOrb.tsx`: reduced-motion-safe animation lifecycle and explicit accessibility state semantics.
- `apps/mobile/app/assistant-premium.tsx`: explicit session versioning, stale async continuation guards, native abort on unmount/session replacement, locale-bound STT/TTS flow.
- `apps/mobile/app.json`: professional English fallback permission copy for camera, microphone and speech recognition.
- `apps/mobile/scripts/d1-voice-readiness-check.cjs`: enforces permissions, locale binding, state transitions, session isolation, abort cleanup, TTS safety and assistant locale propagation.
- `apps/mobile/scripts/d1-final-verification.cjs`: one-command deterministic gate across mobile and backend verification layers.
- `apps/mobile/package.json`: exposes `d1:final` for the final gate.
- `apps/mobile/scripts/voice-quality-check.cjs`: enforces multilingual voice contracts plus abort-safe STT and timeout-safe TTS regression guards.
- `apps/backend/src/modules/assistant/dto/process-assistant-request.dto.ts`: bounded assistant message payload and validated optional locale shape.
- `apps/backend/src/modules/assistant/dto/confirm-assistant-request.dto.ts`: dedicated validation contract for confirmation tokens.
- `apps/backend/src/modules/assistant/controllers/assistant.controller.ts`: explicit typed request contracts and locale forwarding for assistant processing.
- `apps/backend/src/modules/assistant/services/assistant.service.ts`: preferred locale now reaches semantic multilingual understanding and is retained in response metadata.
- `apps/backend/src/modules/assistant/controllers/assistant.controller.spec.ts`: regression coverage for locale forwarding at the HTTP boundary.

## Deep review evidence

Review 1 — architecture/diff: verified repository-side D1 changes remain scoped to Voice Core, Assistant transport, safety contracts, accessibility and native configuration. Existing intent/execution semantics remain intact; the final verification script only orchestrates deterministic checks.

Review 2 — implementation/contracts: verified mobile locale source-of-truth, DTO validation, controller forwarding, preferred-language semantic understanding, native speech lifecycle, TTS completion guards, reduced-motion semantics, Voice Orb accessibility, permission configuration and the final verification command are aligned.

## Current evidence

Repository-side D1 work is complete in code and contracts. GitHub Actions did not expose workflow runs for the latest changes, so automated execution is not claimed here. The remaining blockers are the deterministic verification run in the user's environment and real microphone/OS/TTS/device validation.

## Definition of done

D1 is complete when the final deterministic repository gate passes, the real device demonstrates the intended microphone → STT → semantic understanding → deterministic execution → localized response → TTS completion path for the representative locale matrix, recovery behavior is observed for the key failure modes, and durable evidence is recorded in A/B.
