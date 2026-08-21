# Progress — Native Health Providers

Date: 2026-08-21
Branch: `work/canonical-ingredient-intelligence`

## What was added

- Provider-neutral mobile `HealthProvider` contract preserved as the single application boundary.
- iOS HealthKit adapter using `@kingstinct/react-native-healthkit@13.4.0`.
- Android Health Connect adapter using `react-native-health-connect@4.1.3`.
- Shared platform provider factory that loads only the current platform adapter.
- Authenticated health sync client targeting `POST /device-intelligence/health-sync`.
- Incremental sync orchestrator with last-success timestamp stored in AsyncStorage.
- Expo dynamic app config with HealthKit and Health Connect config plugins.
- Android Health Connect read permissions for steps, distance, active/total calories, sleep, exercise, heart rate and weight.
- Expo build-properties configuration for Health Connect requirements.
- EAS development profile producing an installable APK with `expo-dev-client`.
- Provider decisions intentionally keep HealthKit/Health Connect out of backend business logic.

## Version decisions

- HealthKit is pinned to `13.4.0` rather than v14 because an open v14 cold-start permission-sheet regression has been reported; the project's adapter should prefer stable UX over chasing the newest major until that issue is resolved.
- `react-native-nitro-modules` is pinned to `0.35.6` alongside HealthKit v13.4.0 based on the reported known-good combination.
- Health Connect uses v4.1.3, whose Expo integration is bundled inside the package; the deprecated standalone `expo-health-connect` package is intentionally not used.
- `expo-build-properties` is pinned to the Expo SDK 53 compatible `~0.14.8` line.

## Validation state

Backend validation immediately before this mobile-native phase:

- Typecheck: PASS
- Prisma generate: PASS
- Build: PASS
- Full backend Jest: 158/158 suites — PASS
- Tests: 422/422 — PASS

The new native provider code has not yet been validated in an iOS/Android development build on a real device. That is intentionally the next validation boundary.

## Next validation

```bash
cd ~/My-Personal-Assistant
pnpm install

cd apps/mobile
pnpm run typecheck
npx expo config --type public

eas build --profile development --platform android
# iOS: eas build --profile development --platform ios
```

Then on real devices:

1. Open the native development build.
2. Request health permissions.
3. Confirm steps/distance/calories/weight/HR/workout/sleep samples are readable.
4. Sync twice and verify idempotent source-record handling.
5. Confirm the backend daily summary feeds the Personal Brain without duplicated activity.

## Product impact

This moves the app from a backend-only normalized health-data gateway to a real cross-platform native health integration boundary. After device validation, the next slice is to connect the normalized daily health summary to adaptive nutrition, workout progression and proactive Personal Brain decisions.
