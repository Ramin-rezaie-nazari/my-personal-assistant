# Mobile Deep Read

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: `apps/mobile/package.json`, `app.json`, Expo Router root/auth/language/index/command-center aliases, command-center-v2, daily, assistant, brain-overview, onboarding, calendar, reminders, habits, inventory, meals, meal-builder, recipe-match, shopping, smart-meals, supplements, notifications, yoga, insights, price-history; core clients `lib/api.ts`, `assistant-api.ts`, `brain-execution.ts`, `calendar-api.ts`, `inventory-api.ts`, `recipe-api.ts`, `shopping-api.ts`, `shopping-basket-api.ts`, `price-api.ts`, `command-actions.ts`, `onboarding.ts`, `i18n.ts`, `yoga-camera-bridge.ts`; mobile branding/notification contract specs. Read is file-level for this enumerated scope; runtime/device validation not performed.
Scope not yet read: remaining Mobile app route trees such as meal detail and any routes/components/libs not enumerated; complete mobile directory inventory reconciliation; native config files beyond `app.json`; physical-device behavior; full accessibility and responsive review; all mobile tests beyond inspected contract/unit specs; all backend-to-mobile consumers and route coverage; offline implementation outside current API clients; production build execution.
Evidence roots: `apps/mobile/app/`; `apps/mobile/lib/`; `apps/mobile/components/`; `apps/mobile/package.json`; `apps/mobile/app.json`; `.github/workflows/mobile-ci.yml` and EAS workflows; backend controllers/services used by the clients.
Confidence level: HIGH for the file-level findings below; MEDIUM for app-wide completeness because the full route/component inventory and physical-device/runtime checks remain pending.
Open questions: remaining route files; full backend/mobile contract matrix; exact runtime navigation behavior; native permission/restart semantics for RTL; build/typecheck result on target commit; offline policy and scope; accessibility/RTL completeness.

## Confirmed mobile findings

- `apps/mobile/lib/api.ts` implements access-token refresh on 401, but multiple domain clients duplicate a separate request/refresh implementation (or do not refresh at all). `assistant-api.ts`, `calendar-api.ts`, `inventory-api.ts`, `recipe-api.ts`, `shopping-api.ts`, `shopping-basket-api.ts` and `price-api.ts` each own network/auth logic, creating divergent retry, logout and error semantics.
- `apps/mobile/lib/assistant-api.ts` calls history/message endpoints with `authorizedFetch()` but does not refresh a valid refresh token after a 401. The main `lib/api.ts` does refresh. A user can therefore have a still-valid session via refresh token while Assistant alone reports a failed request.
- `apps/mobile/app/onboarding.tsx` collects substantial profile, nutrition, fitness, schedule and permission state but completion only writes AsyncStorage through `setOnboardingState()`. No backend profile/onboarding write is called in the inspected file. The account's server-side profile can therefore remain unrelated to the onboarding answers.
- `apps/mobile/lib/onboarding.ts` uses a version number but otherwise spreads parsed AsyncStorage values into `OnboardingState` without runtime shape/value validation. A corrupted/stale stored value can become application state if its version happens to match.
- `apps/mobile/app/brain-overview.tsx` ignores the locale/i18n system and hardcodes English UI text. It also relies on `brain-execution.ts` action routes that are absent from `PersonalBrainController` in the audited target.
- `apps/mobile/lib/brain-execution.ts` posts to `POST /personal-brain/decision/execute-next`, `/personal-brain/decision/confirm`, and `/personal-brain/decision/feedback`; source inspection found the confirm/outcome routes in some Brain controller surface, but the exact execute-next/feedback paths are not exposed by the controller file inspected. These action buttons therefore require contract reconciliation before being considered functional.
- `apps/mobile/app/language.tsx` changes `I18nManager.allowRTL()` but does not force RTL/layout direction reload. More importantly, most screens hardcode strings and do not consume `i18n.ts`, so selecting Persian does not produce a consistent localized application.
- `apps/mobile/lib/i18n.ts` contains only a small translation dictionary while many production screens define their own unlocalized copy. RTL is applied inconsistently (`direction: 'rtl'` on some containers, explicit `textAlign` on others, no global provider/context).
- `apps/mobile/app/daily.tsx` calls `generateSmartNotifications()` every time the Daily screen's data loader runs, before fetching the command-center data. Opening or refreshing a read-only daily screen therefore performs a mutating notification-generation action as a side effect.
- `apps/mobile/app/meal-builder.tsx` creates `dateKey` with `new Date().toISOString().slice(0,10)` while `eatenAt` is UTC ISO. This can assign a locally logged meal to the previous/next calendar day around timezone boundaries. This is a Mobile manifestation of the backend UTC dateKey issues.
- Meal Builder treats `FoodItem` nutrition as per raw numeric `quantity` and sends no unit/serving basis. This is coupled to the backend FoodItem base-unit ambiguity (PB-030/PB-038).
- `apps/mobile/app/supplements.tsx` has no visible error state or try/catch around add/take/delete operations. Failed mutations can reject without user feedback or recovery UI.
- `apps/mobile/app/yoga.tsx` has a broken Continue action: it calls `tickYogaCoach(...)` with zero remaining seconds but discards the returned state instead of calling `setState()`, so the visible coach state does not advance from that button.
- `apps/mobile/app/yoga.tsx` presents a live camera UI, but `cameraBridge` is an `UnconfiguredYogaCameraBridge`. `isAvailable()` is false and `subscribe()` is a no-op, so no frames flow into `analyzeYogaPose()`. The live camera therefore is not connected to actual pose analysis in the inspected implementation.
- `apps/mobile/app/yoga.tsx` also labels the camera overlay as "تحلیل روی دستگاه" only when provider is `on_device`, but the actual configured provider is `unconfigured`; the UI does fallback to a no-recording label in that case. Functional gap remains because analysis never occurs.
- `apps/mobile/app/habits.tsx`, `inventory.tsx`, `meals.tsx`, `meal-builder.tsx`, `recipe-match.tsx`, `shopping.tsx`, `smart-meals.tsx`, `supplements.tsx`, `yoga.tsx`, `insights.tsx` and much of `calendar.tsx` hardcode English or mixed-language UI despite the app-level fa/en switch. `shopping.tsx` additionally embeds a Persian price-history label inside otherwise English copy.
- `apps/mobile/app/inventory.tsx` exposes only quantity adjustment for existing inventory items. Its empty state tells users to start adding foods, but the inspected screen provides no add-inventory UI; inventory creation exists only as a library function. This is a feature-completeness gap in the inspected UX.
- `apps/mobile/app/smart-meals.tsx` implements a separate local recommendation algorithm using loaded Foods + Inventory + NutritionSummary rather than consuming the backend Recommendation Intelligence/MealPlanning/FoodOperatingLoop output. It filters foods by `quantity > 0` and constructs suggestions locally, creating a second recommendation contract that can diverge from backend intelligence.
- `apps/mobile/app/command-center-v2.tsx` quick commands are hard-coded fixed operations: 500 ml water, 20-min/100 kcal walk, 45-min/300 kcal strength, and a reminder at 20:00. They are not derived from user settings, current state, locale or timezone in the inspected implementation.
- `apps/mobile/lib/api.ts` is a hand-written API contract layer for a large number of backend endpoints. There is no generated schema/client, so backend DTO/response changes can compile independently from Mobile and fail at runtime.
- No offline queue/cache implementation was found in the inspected Mobile runtime. Search for `NetInfo` returned no matches; current clients are network-first and expose error/loading states but do not persist mutation queues for connectivity loss. This is a known roadmap capability gap rather than a runtime crash by itself.
- Mobile has only a small amount of automated unit/contract testing in the inspected tree (`branding.spec.ts`, `notifications/notification-contract.spec.ts`). No screen-level integration/E2E test runner is configured in `apps/mobile/package.json`, and no Jest/Detox/Maestro dependency or script was found.
- `apps/mobile/app.json` leaves `expo.experiments.typedRoutes` false, so navigation paths are not compiler-checked by Expo Router. This increases the chance of stale route strings surviving typecheck.
- `apps/mobile/package.json` exposes only start/android/ios/web/typecheck scripts. There is no dedicated lint/test/build verification script in the package itself; CI therefore becomes the main quality gate for this app.

## Mobile issue IDs

- PB-111: Onboarding answers are stored locally only; no backend profile/onboarding synchronization in inspected screen.
- PB-112: Brain execute/feedback Mobile routes do not match an exposed controller route in the audited backend target; contract break requires reconciliation.
- PB-113: Brain Overview is not localized and ignores app locale.
- PB-114: Onboarding AsyncStorage state is versioned but not runtime-validated.
- PB-115: Mobile localization/RTL is partial and inconsistent across screens; language screen does not force a full RTL layout restart.
- PB-116: Daily screen performs notification generation as a read-screen side effect on every load/refresh.
- PB-117: Meal Builder derives dateKey in UTC and can log a meal to the wrong local day.
- PB-119: Supplements mutations have no visible error handling/recovery state.
- PB-120: Yoga camera mode is unconfigured; no pose frames are analyzed despite the live-camera UX.
- PB-121: Reminders edit displays the stored time using locale `'en'` even when the current app locale is Persian (`apps/mobile/app/reminders.tsx`, `openEdit`).
- PB-122: No Mobile offline cache/mutation queue was found in the inspected runtime.
- PB-123: EAS Android build workflows are duplicated (`eas-android.yml` and `eas-preview.yml`) for substantially the same preview build responsibility.
- PB-124: Command-center quick actions use hard-coded amounts/times independent of user context.
- PB-125: Mobile automated test coverage is limited to a few contract/unit specs; no screen-level integration/E2E test setup was found.
- PB-126: Mobile API clients duplicate authentication/request implementations and can diverge in refresh/error semantics; `assistant-api.ts` is already demonstrably inconsistent with main `api.ts`.
- PB-127: `apps/mobile/app.json` has Expo Router `typedRoutes: false`, leaving navigation route strings unchecked at compile time.

## Remaining Mobile work

Read the remaining route/component/library inventory, especially `app/meal/*`, settings/auth-adjacent screens, notification/camera pipelines and any unenumerated utilities. Then reconcile every Mobile screen to backend routes, update the file review index/feature matrix/contract matrix/checkpoints/review gaps/changelog, and only then close the Mobile deep read.
