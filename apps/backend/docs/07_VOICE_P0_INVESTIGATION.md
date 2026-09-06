# Voice P0 Investigation — Android Native TTS Crash

## Status

**P0 — contained for investigation; not resolved.**

The reported Android crash is:

```text
FORTIFY: pthread_mutex_lock called on a destroyed mutex
Fatal signal 6 (SIGABRT)
```

The failure is associated with specific Persian native TTS candidate voices in the user's local Android WIP (Nila/Roya/Mahsa/Darya), while previously tested voice paths such as Venus were able to work. The failing Android native implementation is not part of the tracked Recommendation Intelligence branch; the relevant native/WIP files remain local and intentionally untouched.

## Current tracked voice architecture

`apps/mobile/lib/voice.ts` routes Persian speech to `speakPersianLocally(...)` first and falls back to installed system Persian TTS. The tracked local provider keeps one cached `TtsEngine` promise and explicitly destroys the native engine from `releaseLocalPersianTts()`.

`apps/mobile/lib/local-persian-tts.ts` uses the `vits-piper-fa_IR-ganji-medium` model and `react-native-sherpa-onnx` for local generation. Engine reuse and destruction therefore form a critical native-lifecycle boundary.

## Evidence from upstream

The sherpa-onnx project has documented Android native crashes with the exact `pthread_mutex_lock called on a destroyed mutex` family of failure, including an Android initialization path. It also has a 2026 issue documenting TTS crashes after repeated generation on the same TTS instance, where destroying and recreating the engine avoids the failure. These reports do not prove the same root cause for MYPA, but they make native lifecycle/state corruption a high-priority hypothesis.

## Static code review finding — tracked provider

The tracked JS layer had a meaningful lifecycle risk even before the failing candidate WIP was inspected directly:

- `stopCurrentPlayback()` stops and unloads the active `Audio.Sound`, but it does not cancel an in-flight `engine.generateSpeech(...)` call.
- `activePlaybackToken` prevents stale generated audio from being committed after a newer request, but it does not by itself serialize concurrent native generation calls against the shared cached engine.
- `releaseLocalPersianTts()` previously destroyed the shared engine after awaiting `enginePromise`, without an explicit native-operation lease boundary.

## Lifecycle hardening now implemented

`apps/mobile/lib/local-persian-tts.ts` now serializes native engine operations through a single promise queue.

The important behavior is:

```text
normal operation
   ↓
generation owns the native engine
   ↓
generation settles
   ↓
release may destroy the engine
```

A release request now marks the provider as releasing **before** it enters the native queue. That blocks new generations while allowing an already-running native operation to finish. `destroy()` is queued behind the active operation, so the code no longer intentionally destroys the shared engine concurrently with a tracked `generateSpeech()` call.

Stale playback tokens are still preserved, and generated audio is deleted when a request becomes stale or release begins.

This is a JS/native-lifecycle hardening step. It materially narrows one race window, but it does **not** prove that the upstream/native mutex crash is fixed.

## Runtime dependency correction

The mobile package now explicitly declares the runtime dependencies used by the tracked local voice path:

- `expo-av` for `Audio.Sound` playback;
- `expo-file-system` for model/archive and generated-audio file handling;
- `react-native-sherpa-onnx` for offline native TTS generation.

The current app is on Expo SDK 53 / React Native 0.79, so the Expo AV dependency is pinned to the SDK-compatible `~15.1.7` line. `react-native-sherpa-onnx` is currently declared at `^0.4.3`.

The dependency manifest change requires a fresh lockfile update and mobile CI validation before this checkpoint can be called green.

## Investigation rules

1. Do not fake or reinterpret a native abort as a JavaScript exception; an Android SIGABRT must be treated as a native-resource defect.
2. Do not declare a candidate voice valid because model files exist or initialization succeeds once.
3. Each candidate voice must pass repeated generation, stop, playback interruption, voice switching, background/foreground and engine-release scenarios on the target Android device.
4. Do not destroy an engine while an outstanding native generation/playback operation can still reference it.
5. Do not change the working Venus/Ganji/Khadijah path merely to make an unvalidated candidate pass.
6. Candidate-specific native resources must be isolated so one bad model cannot corrupt another voice's engine lifecycle.

## Candidate diagnostic plan

The candidate models should be tested with both shared-engine and fresh-engine-per-generation behavior. A fresh-engine pass would strengthen the lifecycle-corruption hypothesis, but it would still require performance, memory and battery evaluation before production use.

The local Android WIP must be inspected directly because the candidate native/model files are not tracked in this branch. The next device checkpoint should capture:

- candidate model → voice-ID mapping;
- whether multiple engines share native singleton state;
- whether `destroy()` can race with generation or playback callbacks;
- whether model switching destroys the previous engine before all work completes;
- candidate-specific asset/configuration differences;
- whether the crash disappears with fresh-engine-per-generation;
- exact Android `react-native-sherpa-onnx` and bundled sherpa-onnx native versions.

## Safety posture

Until repeated real-device validation is complete, the P0 remains open. Previously validated voice/model paths remain the safe default, and candidate voices must not be treated as production-safe merely because the JS lifecycle race has been narrowed.
