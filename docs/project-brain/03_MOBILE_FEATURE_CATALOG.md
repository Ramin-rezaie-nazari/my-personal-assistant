# Mobile Feature Catalog

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: Mobile package/app config; Expo Router routes `auth`, `language`, root/command-center, `assistant`, `brain-overview`, `daily`, `calendar`, `reminders`, `habits`, `inventory`, `meals`, `meal-builder`, `meal/[id]`, `recipe-match`, `shopping`, `smart-meals`, `supplements`, `notifications`, `onboarding`, `price-history`, `yoga`, `insights`; inspected API clients, onboarding/i18n, notification runtime/registration/action helpers, voice/TTS, yoga camera/pose pipeline, selected components/tests; corresponding backend controllers/services used by these paths.
Scope not yet read: remaining Mobile library/component/native files, every test, complete backend-to-mobile route matrix, accessibility/responsive runtime validation, physical-device behavior, offline implementation outside inspected clients, production build execution.
Evidence roots: `apps/mobile/app/`; `apps/mobile/lib/`; `apps/mobile/components/`; `apps/mobile/package.json`; `apps/mobile/app.json`; `.github/workflows/mobile-ci.yml`; corresponding backend modules.
Confidence level: HIGH for feature entries below where source is explicitly marked read; MEDIUM for app-wide completeness.
Open questions: remaining files/consumers; exact runtime route behavior; device/native permission semantics; runtime build/typecheck/test results; full accessibility/offline verification.

| Feature | Route/source | Backend/API | State/Persistence | Loading/Error/Offline | Localization/RTL | Tests | Status |
|---|---|---|---|---|---|---|---|
| Authentication | `app/auth.tsx`, `lib/api.ts` | `/auth/*` | AsyncStorage tokens | loading/error; no offline queue | fa/en partial | unit/contract around broader auth incomplete | IN_PROGRESS |
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

## Feature-level audit notes

- The Mobile feature graph is network-first; no durable offline mutation queue/cache was observed.
- Several features implement domain logic locally rather than consuming the backend canonical intelligence path, especially Smart Meals.
- Localization is not centralized in actual screen usage; app locale selection does not guarantee fully localized/RTL UI.
- Mobile authentication storage uses AsyncStorage for access and refresh tokens.
- Runtime/device validation has not been executed; all `VERIFIED_BY_TEST` claims are intentionally absent here.

## Remaining work

Complete remaining Mobile source inventory, map every screen/component/client to exact backend route/controller/service/DTO/output/auth/db effects, reconcile test coverage and support gaps, and then close this catalog only when every in-scope feature is file-read complete and all unexplained gaps are documented.
