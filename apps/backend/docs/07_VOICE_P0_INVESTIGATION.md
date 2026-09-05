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

`apps/mobile/lib/voice.ts` routes Persian speech to `speakPersianLocally(...)` first and falls back to installed system Persian TTS. The tracked local provider currently keeps one cached `TtsEngine` promise and explicitly destroys the native engine from `releaseLocalPersianTts()`.

`apps/mobile/lib/local-persian-tts.ts` currently uses the bundled/downloaded `vits-piper-fa_IR-ganji-medium` model and `react-native-sherpa-onnx` for local generation. Engine reuse and destruction therefore form a critical native-lifecycle boundary.

## Evidence from upstream

The sherpa-onnx project has documented Android native crashes with the exact `pthread_mutex_lock called on a destroyed mutex` family of failure, including an Android initialization path. It also has a 2026 issue documenting TTS crashes after repeated generation on the same TTS instance, where destroying and recreating the engine avoids the failure. These reports do not prove the same root cause for MYPA, but they make native lifecycle/state corruption a high-priority hypothesis.

## Investigation rules

1. Do not fake or reinterpret a native abort as a JavaScript exception; an Android SIGABRT must be treated as a native-resource defect.
2. Do not declare a candidate voice valid because model files exist or initialization succeeds once.
3. Each candidate voice must pass repeated generation, stop, playback interruption, voice switching, background/foreground and engine-release scenarios on the target Android device.
4. Do not destroy an engine while an outstanding native generation/playback operation can still reference it.
5. Do not change the working Venus/Ganji/Khadijah path merely to make an unvalidated candidate pass.
6. Candidate-specific native resources must be isolated so one bad model cannot corrupt another voice's engine lifecycle.

## Next diagnostic checkpoint

The local Android WIP must be inspected directly because the failing native files are not currently tracked in this branch. The first code-level review should focus on:

- how candidate model paths are mapped to voice IDs;
- whether multiple engines share native singleton state;
- whether `destroy()` can race with `generateSpeech()` or playback callbacks;
- whether model switching destroys the previous engine before all work completes;
- whether candidate models have differing required assets/configuration;
- whether the crash disappears when every generation uses a fresh engine instance;
- exact `react-native-sherpa-onnx` version and bundled sherpa-onnx Android version.

## Safety posture

Until this investigation is complete, only previously validated voice/model paths should be considered production-safe. The application should prefer a known-good fallback rather than expose a candidate that can abort the Android process.
