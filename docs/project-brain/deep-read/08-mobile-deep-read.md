# Mobile Deep Read

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: `apps/mobile/package.json`, `app.json`, Expo Router root/auth/language/index/command-center aliases, command-center-v2, daily, assistant, brain-overview, onboarding, calendar, reminders, habits, inventory, meals, meal-builder, `meal/[id].tsx`, recipe-match, shopping, smart-meals, supplements, notifications, yoga, insights, price-history; core clients `lib/api.ts`, `assistant-api.ts`, `brain-execution.ts`, `calendar-api.ts`, `inventory-api.ts`, `recipe-api.ts`, `shopping-api.ts`, `shopping-basket-api.ts`, `price-api.ts`, `command-actions.ts`, `onboarding.ts`, `i18n.ts`, `yoga-camera-bridge.ts`, `yoga-pose-pipeline.ts`, `local-persian-tts.ts`, `meal-intelligence.ts`, notification push registration and selected specs. Runtime/device/build execution not performed.
Scope not yet read: remaining Mobile route/component/library files beyond this enumerated scope; complete component tree reconciliation; remaining native configuration; physical-device behavior; full accessibility/responsive review; every mobile test file; full backend-to-mobile contract matrix; offline implementation outside inspected clients; production build execution.
Evidence roots: `apps/mobile/app/`; `apps/mobile/lib/`; `apps/mobile/components/`; `apps/mobile/package.json`; `apps/mobile/app.json`; `.github/workflows/mobile-ci.yml` and EAS workflows; backend controllers/services used by the clients.
Confidence level: HIGH for file-level findings below; MEDIUM for app-wide completeness because the full route/component inventory and physical-device/runtime checks remain pending.
Open questions: remaining library/component files; full backend/mobile contract matrix; exact runtime navigation/device behavior; native permission/restart semantics for RTL; actual typecheck/build/test results on target commit; offline policy; full accessibility coverage.

## Confirmed mobile findings

- `apps/mobile/lib/api.ts` implements access-token refresh on 401, but multiple domain clients duplicate a separate request/refresh implementation (or do not refresh at all). `assistant-api.ts`, `calendar-api.ts`, `inventory-api.ts`, `recipe-api.ts`, `shopping-api.ts`, `shopping-basket-api.ts` and `price-api.ts` each own network/auth logic, creating divergent retry, logout and error semantics.
- `apps/mobile/lib/assistant-api.ts` calls history/message endpoints with `authorizedFetch()` but does not refresh a valid refresh token after a 401. The main `lib/api.ts` does refresh.
- `apps/mobile/app/onboarding.tsx` collects substantial profile, nutrition, fitness, schedule and permission state but completion only writes AsyncStorage through `setOnboardingState()`. No backend profile/onboarding write is called in the inspected file.
- `apps/mobile/lib/onboarding.ts` uses a version number but otherwise spreads parsed AsyncStorage values into `OnboardingState` without full runtime shape/value validation.
- `apps/mobile/app/brain-overview.tsx` ignores locale/i18n and hardcodes English UI text. It also relies on `brain-execution.ts` paths that require backend route reconciliation.
- `apps/mobile/lib/brain-execution.ts` posts to `POST /personal-brain/decision/execute-next` and `/personal-brain/decision/feedback`; these exact route paths were not found in the inspected backend controller.
- `apps/mobile/app/language.tsx` changes `I18nManager.allowRTL()` but does not establish a full restart/reload strategy; most screens ignore the locale system.
- `apps/mobile/lib/i18n.ts` contains only a small translation dictionary; many production screens hardcode English/mixed-language strings and use inconsistent RTL handling.
- `apps/mobile/app/daily.tsx` calls `generateSmartNotifications()` every time its loader runs, making a read-screen load/refresh mutate notification state.
- `apps/mobile/app/meal-builder.tsx` creates `dateKey` with `new Date().toISOString().slice(0,10)`, which can assign a locally logged meal to the wrong UTC calendar date.
- Meal Builder sends raw numeric food quantities without a unit/serving basis, coupled to backend FoodItem base-unit ambiguity (PB-030/PB-038).
- `apps/mobile/app/supplements.tsx` has no visible error state or try/catch around add/take/delete operations.
- `apps/mobile/app/yoga.tsx` has a broken Continue action: `tickYogaCoach(...)` result is discarded, so visible coach state does not advance.
- `apps/mobile/app/yoga.tsx` uses `UnconfiguredYogaCameraBridge`; `isAvailable()` is false and `subscribe()` is a no-op, so no frames reach pose analysis.
- Yoga camera UX therefore presents a camera preview without actual pose analysis in the inspected implementation.
- Many screens (`habits`, `inventory`, `meals`, `meal-builder`, `recipe-match`, `shopping`, `smart-meals`, `supplements`, `yoga`, `insights` and parts of `calendar`) hardcode English or mixed-language UI despite fa/en support; `shopping.tsx` mixes a Persian label into English copy.
- `apps/mobile/app/inventory.tsx` provides only quantity adjustment for existing inventory items; the empty state says to add foods but the screen itself has no add action even though `inventory-api.ts` exposes `addInventory()`.
- `apps/mobile/app/smart-meals.tsx` and `lib/meal-intelligence.ts` implement a separate local recommendation algorithm instead of consuming the backend Recommendation Intelligence/MealPlanning/FoodOperatingLoop output. It filters any in-stock FoodItem and constructs pairings heuristically, creating a second recommendation contract.
- `apps/mobile/lib/api.ts` and domain clients are hand-written API contracts rather than a generated client/schema; backend changes can therefore compile independently from Mobile and fail at runtime.
- No offline queue/cache implementation was found in inspected Mobile runtime. `NetInfo` search returned no matches.
- Mobile automated testing is limited in the inspected tree to small unit/contract specs such as `branding.spec.ts` and `notifications/notification-contract.spec.ts`; no screen-level integration/E2E runner was configured in `package.json`.
- `apps/mobile/app.json` has Expo Router `typedRoutes: false`, so navigation route strings are not compiler checked.
- `apps/mobile/package.json` exposes only start/android/ios/web/typecheck scripts; no direct Mobile test/lint/build verification script is defined.
- `apps/mobile/lib/local-persian-tts.ts` imports `expo-av`, `expo-file-system/legacy` and `react-native-sherpa-onnx`, but the Mobile package manifest does not declare these dependencies. Root `package.json` also has no dependencies. This is a build/dependency contract gap.
- The same TTS module downloads a model archive from an external GitHub release URL and checks file existence, but no cryptographic hash/signature/pinned integrity verification is present. A version string alone does not provide artifact integrity assurance.
- `apps/mobile/lib/notifications/push-registration.ts` captures the supplied access token inside `addPushTokenListener()` and calls registration later without a refresh-token flow. A token expiry between registration and token refresh can therefore leave the push-device update unauthenticated.
- All inspected domain clients default `EXPO_PUBLIC_API_URL` to `http://localhost:3000`. The repository's own `apps/mobile/.env.example` instead tells physical-device users to use the computer's LAN IP, so the code default can target the phone itself when no environment override is present.

## Mobile issue IDs

- PB-111: Onboarding answers are stored locally only; no backend profile/onboarding synchronization.
- PB-112: Brain execute/feedback Mobile routes do not match an exposed backend controller route in the audited target.
- PB-113: Brain Overview ignores app locale and hardcodes English.
- PB-114: Onboarding stored-state parser lacks full runtime validation.
- PB-115: Mobile localization/RTL handling is partial and inconsistent.
- PB-116: Daily screen generates smart notifications as a read-screen side effect.
- PB-117: Meal Builder derives dateKey in UTC.
- PB-119: Supplements mutations have no visible error handling/recovery state.
- PB-120: Yoga camera mode is unconfigured/no pose frames analyzed.
- PB-121: Reminder edit formats stored time using English locale regardless of current locale.
- PB-122: No Mobile offline cache/mutation queue found.
- PB-123: Duplicate EAS Android preview workflows.
- PB-124: Command-center quick commands use hard-coded amounts/times.
- PB-125: Mobile automated test coverage lacks screen/integration E2E setup.
- PB-126: Mobile API clients duplicate authentication/request implementations and diverge in refresh/error semantics.
- PB-127: Expo Router typed routes disabled.
- PB-128: Local Persian TTS imports undeclared runtime dependencies.
- PB-129: Local Persian TTS downloads an external model without cryptographic artifact integrity verification.
- PB-130: Push-token refresh listener can reuse an expired access token because it lacks auth-refresh handling.
- PB-131: Mobile API default `localhost:3000` is incompatible with physical-device access when no environment override is supplied.

## Remaining Mobile work

Read the remaining component/library/native inventory and reconcile every screen to backend route, provider, state, persistence, loading/error, offline, localization/RTL/accessibility and test coverage. Then update the file review index, contract matrix, feature matrix, checkpoints, review gaps and changelog before closing this deep read.
