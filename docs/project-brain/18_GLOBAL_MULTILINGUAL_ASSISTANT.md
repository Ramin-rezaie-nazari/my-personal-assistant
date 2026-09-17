# Global Multilingual Assistant Contract

Last updated: 2026-09-17
Status: IMPLEMENTED / RUNTIME DEVICE VERIFICATION PENDING

## Goal

MYPA must behave as one product in the user's selected language. The 51 base application languages share the same product behavior, and regional language variants may be added without creating a second business-logic implementation.

The user's selected locale is the single presentation-language source of truth for:

- visible mobile UI copy;
- validation, empty, loading and error states;
- assistant input/output presentation;
- voice/TTS language;
- locale-aware date/time presentation;
- dynamic assistant messages and other server-produced human-readable copy;
- RTL behavior where the selected locale requires it.

Brand names, product names and user-authored content are not silently translated unless the UX explicitly marks them as translatable content.

## Language set

The canonical base list is the existing 51 `SupportedAppLocale` values in `apps/mobile/lib/languages.ts`.

`az` is exposed as the regional Azerbaijani Turkish / Iranian Turkic option, while `tr` remains Turkish (Türkiye). These are deliberately distinct selectable paths because their vocabulary, orthography and speech expectations are not interchangeable.

Legacy locale codes remain type-compatible only for old source compatibility and are not selectable/persisted as new user choices.

## Architecture

```text
User selected locale
        │
        ├── Mobile UI locale / RTL
        │
        ├── Assistant language gateway
        │      ├── input: selected locale → canonical assistant language
        │      └── output: canonical assistant language → selected locale
        │
        ├── TTS locale
        │
        └── Dynamic content localization

Canonical domain logic / Brain / deterministic actions
        │
        └── language-neutral intents, entities, decisions and execution
```

The Brain remains deterministic and language-neutral for business-critical decisions. Language translation is a boundary concern, not a replacement for domain rules.

## Implemented repository changes

- `apps/mobile/lib/languages.ts` owns the 51 base languages plus the Iranian Azerbaijani Turkish regional option.
- `apps/mobile/lib/runtime-translator.ts` provides a bidirectional translation bridge instead of only English → target translation.
- `apps/mobile/app/assistant.tsx` translates selected-language input to the canonical assistant language before sending it to the backend, and localizes assistant responses before rendering them.
- `apps/mobile/lib/assistant-tts.ts` now uses the selected locale instead of a hard-coded Persian/English switch.
- `apps/mobile/lib/voice-language.ts` maps the application locale set to locale-specific speech tags.
- The backend local assistant provider and AssistantService now emit canonical English responses rather than hard-coded Persian text; this prevents a Persian response from leaking into another selected locale and gives the mobile language gateway a stable source language.
- The language picker exposes the 51 base languages and the Iranian Azerbaijani Turkish regional variant and avoids visible hard-coded English labels in its main interaction surface.

## Dynamic content rule

Dynamic server content that is intended for the user must either:

1. already carry localized content for the selected locale; or
2. carry a canonical-language value plus an explicit canonical-language marker so the mobile language gateway can translate it.

User-authored content such as a custom meal name, calendar event title, habit name or shopping item remains user-authored data and is never overwritten merely because the app locale changes.

## Voice rule

The TTS request follows the selected application locale. Device OS voice availability is an environment capability; the repository must never silently substitute Persian or English as the semantic language of the assistant. A missing device voice is reported as a device capability limitation.

## Quality gates

A multilingual implementation is not considered complete merely because the language picker contains 51 entries. The repository quality gate requires:

- one canonical locale registry;
- UI copy reachable through the locale layer rather than foreign-language hard-coding;
- bidirectional assistant language bridging;
- locale-aware TTS routing;
- no cross-locale translation cache contamination;
- tests for 51 base locales plus regional locale compatibility;
- CI typecheck/source-test coverage;
- physical-device validation for actual translation-model availability, voice availability and RTL rendering.

## Evidence boundary

The repository can verify source contracts and automated tests. It cannot, from GitHub CI alone, prove that every platform/device has every translation model and TTS voice installed and operational. Those are explicitly environment-limited checks and must remain marked as such until real-device validation is captured.
