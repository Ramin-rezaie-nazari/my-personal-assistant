# My Personal Assistant — Work Log

This file records meaningful development slices so future sessions can resume without repeating completed work.

## 2026-08-18 — Global Settings Mobile Integration

### Completed

- Added `apps/mobile/lib/global-settings-api.ts`.
  - Reads/writes `/assistant/settings/global`.
  - Reuses the existing mobile auth session storage.
  - Refreshes the access token after a 401 before retrying the settings request.
  - Keeps the backend global-settings contract typed in the mobile app.
- Added `apps/mobile/app/settings.tsx`.
  - Loads the persisted global user settings.
  - Supports language selection for the current first-generation 17-language voice set.
  - Supports country selection.
  - Supports currency selection.
  - Supports metric / US customary / UK imperial units.
  - Supports timezone editing.
  - Supports assistant voice selection across the first-generation voice profiles.
  - Shows save/error/loading states.
- Registered `/settings` in `apps/mobile/app/_layout.tsx`.
- Added a persistent settings shortcut alongside the assistant shortcut so authenticated users can reach global settings from the main app shell.

### Validation status

Local runtime validation is still pending because this slice is being prepared through the GitHub feature branch and mobile CI is the authoritative environment for the Expo/React Native typecheck and bundle validation.

Expected CI commands:

```text
pnpm --filter @my-personal-assistant/mobile typecheck
pnpm --filter @my-personal-assistant/mobile exec expo config --type public
pnpm --filter @my-personal-assistant/mobile exec expo export --platform android --output-dir /tmp/mobile-export
```

### Next after CI green

- Add persisted global settings to the mobile app's richer preference/onboarding flow where appropriate.
- Wire language selection to full mobile i18n expansion beyond the current fa/en chrome.
- Continue with the real offline voice runtime boundary.
