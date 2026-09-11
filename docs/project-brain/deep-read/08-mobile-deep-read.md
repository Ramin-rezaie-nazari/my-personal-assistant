# Mobile Deep Read

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: `apps/mobile/package.json`, `app.json`, Expo Router root/auth/language/index/command-center aliases, command-center-v2, daily, assistant, brain-overview, onboarding, calendar, reminders, habits, inventory, meals, meal-builder, `meal/[id].tsx`, recipe-match, shopping, smart-meals, supplements, notifications, yoga, insights, price-history; core clients `lib/api.ts`, `assistant-api.ts`, `brain-execution.ts`, `calendar-api.ts`, `inventory-api.ts`, `recipe-api.ts`, `shopping-api.ts`, `shopping-basket-api.ts`, `price-api.ts`, `command-actions.ts`, `onboarding.ts`, `i18n.ts`, `yoga-camera-bridge.ts`, `yoga-pose-pipeline.ts`, `local-persian-tts.ts`, `meal-intelligence.ts`, `voice.ts`, notifications push-registration/push-runtime/notification-actions and selected specs/components. Runtime/device/build execution not performed.
Scope not yet read: remaining Mobile route/component/library files; full component tree reconciliation; remaining native configuration; physical-device behavior; full accessibility/responsive review; every mobile test file; full backend-to-mobile contract matrix; offline implementation outside inspected clients; production build execution.
Evidence roots: `apps/mobile/app/`; `apps/mobile/lib/`; `apps/mobile/components/`; `apps/mobile/package.json`; `apps/mobile/app.json`; `.github/workflows/mobile-ci.yml`, Android/EAS workflows; backend controllers/services used by clients.
Confidence level: HIGH for file-level findings below; MEDIUM for app-wide completeness because full library/component inventory and physical-device/runtime checks remain pending.
Open questions: remaining library/component files; full backend/mobile contract matrix; exact runtime navigation/device behavior; native permission/restart semantics for RTL; actual typecheck/build/test results on target commit; offline policy; full accessibility coverage; SVG asset build behavior.

## Confirmed mobile findings

- `apps/mobile/lib/api.ts` implements access-token refresh on 401, but multiple domain clients duplicate separate request/auth implementations (or do not refresh at all). This creates divergent retry, logout and error semantics.
- `apps/mobile/lib/assistant-api.ts` calls history/message endpoints without the shared 401 refresh flow.
- `apps/mobile/app/onboarding.tsx` collects substantial profile/nutrition/fitness/schedule/permission state but completion only writes AsyncStorage; no backend onboarding/profile write is called in the inspected file.
- `apps/mobile/lib/onboarding.ts` version-checks stored state but otherwise accepts parsed values without full runtime shape/value validation.
- `apps/mobile/app/brain-overview.tsx` hardcodes English and uses `brain-execution.ts` execution APIs.
- Correction to a prior audit note: `POST /personal-brain/decision/execute-next` and `POST /personal-brain/decision/feedback` DO exist in the audited backend (`personal-brain/controllers/decision-execution.controller.ts` and `decision-feedback.controller.ts`) and are JWT-protected. The earlier route-mismatch finding is therefore NOT_APPLICABLE/false and must not be treated as an open Mobile contract break. `POST /personal-brain/decision/confirm` is also exposed by the execution controller.
- `apps/mobile/app/language.tsx` changes `I18nManager.allowRTL()` but does not establish a full restart/layout-reload strategy; most screens ignore the locale system.
- `apps/mobile/lib/i18n.ts` has only a small dictionary; many screens hardcode English/mixed-language UI and use inconsistent RTL handling.
- `apps/mobile/app/daily.tsx` calls `generateSmartNotifications()` every time its loader runs, making read-screen load/refresh mutate notification state.
- `apps/mobile/app/meal-builder.tsx` derives `dateKey` from UTC ISO and can assign a locally logged meal to the wrong day.
- Meal Builder sends raw numeric food quantities without a unit/serving basis, coupled to backend FoodItem base-unit ambiguity.
- `apps/mobile/app/supplements.tsx` has no visible error state or try/catch around add/take/delete mutations.
- `apps/mobile/app/yoga.tsx` Continue discards the new `tickYogaCoach()` result, so visible coach state does not advance from that button.
- `apps/mobile/app/yoga.tsx` uses `UnconfiguredYogaCameraBridge`; no frames reach pose analysis.
- Many production screens hardcode English/mixed-language copy despite fa/en support.
- `apps/mobile/app/inventory.tsx` has no add-inventory UI despite `inventory-api.ts` exposing `addInventory()`.
- `apps/mobile/app/smart-meals.tsx` + `lib/meal-intelligence.ts` use a separate local heuristic meal recommender instead of backend recommendation/meal-planning output.
- `apps/mobile/lib/api.ts` and domain clients are hand-written API contracts rather than generated schema/client.
- No offline queue/cache implementation was found in inspected Mobile runtime.
- Mobile automated tests are limited to a small set of unit/contract specs; no screen-level integration/E2E runner is configured.
- `apps/mobile/app.json` sets `expo.experiments.typedRoutes` false.
- `apps/mobile/package.json` has no dedicated test/lint/build verification script.
- `apps/mobile/lib/local-persian-tts.ts` imports `expo-av`, `expo-file-system/legacy`, `react-native-sherpa-onnx` but these are not declared in Mobile manifest.
- Local TTS model download has no cryptographic integrity verification.
- `apps/mobile/lib/notifications/push-registration.ts` captures a supplied access token in its token-refresh listener and does not invoke shared auth refresh when that token expires.
- Repository search found no active caller of `registerForPushNotifications()` or `listenForPushTokenRefresh()` outside their defining file, so device registration is currently disconnected from app lifecycle.
- `apps/mobile/lib/notifications/push-runtime.ts` defines foreground handler, response listeners and last-response consumption, but repository search found no active caller of `startNotificationRuntime()` or `consumeLastNotificationResponse()` outside that file.
- `apps/mobile/lib/notifications/notification-actions.ts` defines `open/complete/snooze/dismiss` feedback payloads, but no caller was found. Backend has feedback adapter/service, but no matching controller endpoint was found in inspected controller search.
- `apps/mobile/tsconfig.json` excludes all `*.spec.*` and `*.test.*` files, so standard Mobile typecheck does not validate the test files themselves.
- `apps/mobile/lib/voice.ts` imports `expo-speech`, but `apps/mobile/package.json` does not declare `expo-speech`.
- Repository search found no active consumer outside `voice.ts` for `speakAssistantText()`, `stopAssistantSpeech()`, `getStoredVoiceProfile()` or `setStoredVoiceProfile()`, so Voice/TTS feature is currently disconnected from app UI/runtime despite implementation.
- `apps/mobile/lib/price-api.ts` models `PriceSnapshot.currency`, but `apps/mobile/app/price-history.tsx` always renders price values with `تومان`.
- `apps/mobile/app/price-history.tsx` adds zero to the minimum-price calculation, creating a fabricated zero lower bound for positive histories.
- `apps/mobile/lib/brand.ts` and `lib/branding.ts` define overlapping but different BRAND contracts; `branding.ts` is active in inspected UI while `brand.ts` has no observed consumer.
- All inspected domain clients default `EXPO_PUBLIC_API_URL` to `http://localhost:3000`; `.env.example` instructs physical-device users to use the computer LAN IP.
- `.github/workflows/mypa-branch-validation.yml` validates Mobile only with typecheck, while `mobile-ci.yml` performs broader Expo config and Android bundle checks.

## Mobile issue IDs

- PB-111: Local-only onboarding.
- PB-112: NOT_APPLICABLE — earlier route mismatch finding was disproven; execute-next and feedback routes exist and are guarded.
- PB-113: Brain Overview localization gap.
- PB-114: Onboarding state lacks runtime validation.
- PB-115: Partial localization/RTL.
- PB-116: Daily read-screen notification generation side effect.
- PB-117: UTC Meal Builder dateKey.
- PB-119: Supplements mutation error gap.
- PB-120: Unconfigured Yoga camera/analysis.
- PB-121: Reminder edit locale bug.
- PB-122: No offline queue/cache.
- PB-123: Duplicate EAS workflows.
- PB-124: Hard-coded Command Center quick actions.
- PB-125: Limited Mobile test coverage/no E2E setup.
- PB-126: Duplicated Mobile API auth clients.
- PB-127: typedRoutes disabled.
- PB-128: Local TTS undeclared dependencies.
- PB-129: TTS model integrity not verified.
- PB-130: Push token refresh listener lacks shared token refresh.
- PB-131: localhost API default on physical device.
- PB-132: Branch-validation Mobile gate weaker than normal Mobile CI.
- PB-133: SVG asset requires build validation.
- PB-134: Mobile auth tokens stored in AsyncStorage.
- PB-135: Content recommendation orphan.
- PB-136: Content media/license schema drift.
- PB-137: Dashboard UTC day/week.
- PB-138: Daily Command Center future workout boundary.
- PB-139: Public Device Intelligence endpoint.
- PB-140: Active FitnessController req.user.sub mismatch.
- PB-141: Content recommendation test gap.
- PB-142: Dashboard/Daily Command Center future-activity test gap.
- PB-147: Price History hardcodes تومان despite currency field.
- PB-148: Price History chart fabricated zero minimum.
- PB-149: Push registration helpers have no active application consumer.
- PB-150: Notification runtime bootstrap has no active application consumer.
- PB-151: Notification action feedback has no active transport/consumer.
- PB-152: Mobile typecheck excludes test files.
- PB-153: Duplicate legacy/active brand contracts.
- PB-154: Voice/TTS `expo-speech` dependency undeclared.
- PB-155: Voice/TTS feature has no observed active app consumer.

## Remaining Mobile work

Complete remaining route/component/library/native inventory, reconcile every screen and client to backend method/path/controller/service/DTO/output/auth/db effects/error behavior, finish support matrices and review gaps, and perform actual runtime/device/build/test validation where possible. Runtime execution remains explicitly unverified until run.
