# My Personal Assistant — Voice Interaction Contract

## Product goal

Voice is the primary interaction layer of MYPA. The user should be able to speak naturally, receive a spoken response, and complete common life tasks without manually navigating feature screens.

## Persian voice identity

The Persian voice experience is **native Iranian Persian with a Tehran conversational style**. It must not sound like a foreign-language speaker reading Persian. Rhythm, pauses, emphasis, pronunciation and conversational warmth are part of the product identity.

The same architecture must remain multilingual so that locale, country and language can change independently.

## Interaction state machine

```text
Idle
  ↓
Listening
  ↓
Thinking
  ↓
Acting / tool execution
  ↓
Speaking
  ↓
Done
```

Animation is state communication, not decoration. It should feel alive, quick and purposeful.

## Voice profiles

The first product contract exposes ten persistent character presets: five feminine and five masculine. Their UI names describe the intended delivery style; they do not hard-code a single vendor voice identifier.

This keeps the same user choice compatible with:

1. the device TTS engine;
2. an offline/local TTS model;
3. a future free-tier provider;
4. a future premium provider without changing the conversation layer.

## Speech input

The current mobile adapter uses native speech recognition with **on-device recognition preferred whenever the device reports support**. This keeps the offline-first direction intact while allowing a fallback to the platform recognizer when local recognition is unavailable. The adapter also supplies Persian contextual vocabulary for common MYPA terms.

## Speech output

The current shell uses device TTS through Expo Speech. Voice rate, pitch and locale come from the persistent voice profile. Later, a higher-quality offline/local TTS engine can replace the provider behind the same `speakAssistantText` contract.

## Remember-once behavior

The selected voice profile is stored locally and restored automatically. User context, preferences and durable facts continue to come from the existing persistent context layer rather than feature-specific forms.

## Free / provider-agnostic rule

No paid cloud voice provider is required for the base product flow. External providers may be added later as optional adapters behind a provider interface; the local/device path remains a usable fallback.

## Current implementation boundary

- Voice-first assistant shell: implemented.
- Animated voice state orb: implemented.
- Ten persistent Tehran voice character presets: implemented.
- Persistent voice selection: implemented.
- Persian speech recognition adapter: implemented, on-device-first.
- Device TTS response path: implemented.
- Next layer: validate the mobile build on a real iOS/Android device, then add a provider interface and offline/local model selection behind the same contract.
