# Mobile Feature Catalog — Historical Audit Baseline

Last updated: 2026-09-13
Review status: HISTORICAL AUDIT SNAPSHOT — NOT CURRENT COMPLETION STATUS

This document preserves the detailed Mobile feature inventory captured during the 2026-09-11 deep-read. Its per-feature `OPEN_GAP` / `IN_PROGRESS` labels describe the audit snapshot at that time and must not be interpreted as current blockers. The canonical current repository status is `docs/05_CURRENT_STATE.md`; current actionable/evidence-limited work is `docs/project-brain/12_OPEN_WORK.md`.

## Current verification boundary

- Mobile CI is GREEN through frozen-lockfile install, typecheck, source tests, committed Jest specs, Expo validation and Android JavaScript bundling.
- Canonical Android native APK CI is GREEN on run `34772364209` (run #79), commit `0d19d2b7dad5e9100505205328fbd523e544445b`, including real Expo prebuild, Gradle `assembleDebug` and APK upload.
- Mobile authentication access/refresh credentials are currently stored through `expo-secure-store`; the historical `AsyncStorage tokens` wording below is retained only as the original audit observation.
- Remaining validation that cannot be completed from repository CI is physical-device behavior (including notifications, microphone, location and speech) plus production Supabase/Auth/RLS/Storage/deployment evidence.

## Historical source snapshot

Scope actually read: Mobile package/app config; Expo Router routes `auth`, `language`, root/command-center, `assistant`, `brain-overview`, `daily`, `calendar`, `reminders`, `habits`, `inventory`, `meals`, `meal-builder`, `meal/[id]`, `recipe-match`, `shopping`, `smart-meals`, `supplements`, `notifications`, `onboarding`, `price-history`, `yoga`, `insights`; inspected API clients, onboarding/i18n, notification runtime/registration/action helpers, voice/TTS, yoga camera/pose pipeline, selected components/tests; corresponding backend controllers/services used by these paths.

Scope not yet read at that historical checkpoint: remaining Mobile library/component/native files, every test, complete backend-to-mobile route matrix, accessibility/responsive runtime validation, physical-device behavior, offline implementation outside inspected clients, production build execution.

Evidence roots: `apps/mobile/app/`; `apps/mobile/lib/`; `apps/mobile/components/`; `apps/mobile/package.json`; `apps/mobile/app.json`; `.github/workflows/mobile-ci.yml`; corresponding backend modules.

Confidence level at the historical checkpoint: HIGH for feature entries below where source was explicitly marked read; MEDIUM for app-wide completeness.

| Feature | Route/source | Backend/API | State/Persistence | Loading/Error/Offline | Localization/RTL | Tests | Historical status |
|---|---|---|---|---|---|---|---|
| Authentication | `app/auth.tsx`, `lib/api.ts` | `/auth/*` | AsyncStorage tokens *(historical observation; current auth tokens use SecureStore)* | loading/error; no offline queue | fa/en partial | unit/contract around broader auth incomplete | IN_PROGRESS |
| Onboarding | `app/onboarding.tsx`, `lib/onboarding.ts` | no inspected backend write on completion | AsyncStorage local state | local only | mixed | no screen test | OPEN_GAP |
| Assistant chat | `app/assistant.tsx`, `lib/assistant-api.ts` | `/assistant`, `/assistant/history` | UI memory/history backend | network-first, no offline queue; no refresh in client | partial | limited | IN_PROGRESS |
| Brain overview | `app/brain-overview.tsx`, `lib/brain-execution.ts` | overview + decision execute/confirm/feedback routes | backend decision state | network-first | hardcoded English | no screen E2E | OPEN_GAP |
| Daily / Command Center | `app/daily.tsx`, `app/command-center-v2.tsx` | daily command center + water/workout/reminder APIs | backend | network-first; read loader mutates notification state | mostly English | no screen E2E | OPEN_GAP |
| Calendar | `app/calendar.tsx`, `lib/calendar-api.ts` | `/calendar/*` | backend | network-first; refresh/error | partial RTL | no screen E2E | IN_PROGRESS |
| Reminders | `app/reminders.tsx`, `lib/api.ts` | `/reminders/*` | backend | loading/error/retry | partial; edit time locale issue | no screen E2E | OPEN_GAP |
| Habits | `app/habits.tsx`, `lib/api.ts` | `/habits/*` | backend | loading/error | mostly English | no screen E2E | OPEN_GAP |
| Inventory | `app/inventory.tsx`, `lib/inventory-api.ts` | `/inventory/*` | backend | loading/error; no offline | mostly English | no screen E2E | OPEN_GAP |
| Meals | `app/meals.tsx`, `app/meal/[id].tsx`, `lib/api.ts` | `/meals` | backend | loading/error | mostly English | no screen E2E | OPEN_GAP |
| Meal builder | `app/meal-builder.tsx` | `/foods`, `/meals` | backend; transient local form | loading/error | mostly English | no screen E2E | OPEN_GAP |
| Recipe matching | `app/recipe-match.tsx`, `lib/recipe-api.ts` | `/recipes/match`, `/shopping/from-recipe` | backend | loading/error | mostly English | no screen E2E | OPEN_GAP |
| Smart meals | `app/smart-meals.tsx`, `lib/meal-intelligence.ts` | Foods/Inventory/Nutrition APIs; recommendation done locally | transient local computation | loading/error | English | no screen E2E | OPEN_GAP |
| Shopping | `app/shopping.tsx`, shopping clients | `/shopping/*`, price history | backend | loading/error | mixed language | no screen E2E | OPEN_GAP |
| Supplements | `app/supplements.tsx`, `lib/api.ts` | `/supplements/*` | backend | initial load only; mutations lack recovery UI | English | no screen E2E | OPEN_GAP |
| Notifications inbox | `app/notifications.tsx`, notification client | `/notifications/*` | backend | loading/error/retry | fa/en UI present | no screen E2E | IN_PROGRESS |
| Push registration | `lib/notifications/push-registration.ts` | `/personal-brain/coach/device` | device ID AsyncStorage | permission/network; no offline queue | language passed | no runtime integration test | OPEN_GAP |
| Push runtime/actions | `lib/notifications/push-runtime.ts`, `notification-actions.ts` | backend feedback path not wired to Mobile | process callbacks | runtime bootstrap consumer not found | payload supports locale | no integration test | OPEN_GAP |
| Voice/TTS | `lib/voice.ts`, `local-persian-tts.ts` | no backend speech endpoint | voice profile local | local/network model download | Persian | no runtime integration test | OPEN_GAP |
| Price history | `app/price-history.tsx`, `lib/price-api.ts` | `/price-intelligence/*` | backend | loading/error | Persian presentation | no screen E2E | OPEN_GAP |
| Yoga coach | `app/yoga.tsx`, yoga clients, camera/pose pipeline | `/yoga/*` | transient local coach state | timer/camera permission | Persian UI | backend service tests exist; no Mobile E2E | OPEN_GAP |
| Insights | `app/insights.tsx`, `lib/api.ts` | `/adaptive-learning/insights` | backend | loading/error/retry | English | no screen E2E | OPEN_GAP |

## Historical audit notes

- The Mobile feature graph was observed as network-first; no durable offline mutation queue/cache was observed at that checkpoint.
- Several features implemented domain logic locally rather than consuming the backend canonical intelligence path, especially Smart Meals.
- Localization was not centralized in actual screen usage at that checkpoint; app locale selection did not guarantee fully localized/RTL UI.
- Runtime/device validation had not been executed at the checkpoint.

## Current source of truth

For completion decisions, do not use the historical status column above. Use `docs/05_CURRENT_STATE.md`, `docs/project-brain/12_OPEN_WORK.md`, and `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md`. The remaining repository-independent work is physical-device and production-environment validation; repository CI/native verification is already green.