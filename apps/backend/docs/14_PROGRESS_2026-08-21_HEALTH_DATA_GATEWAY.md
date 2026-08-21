# Progress — Health Data Gateway — 2026-08-21

## What was built

The project now has the first real backend slice for wearable/health-device integration.

### Backend

- Added normalized `HealthDataPoint` persistence.
- Added provider-neutral health data types:
  - steps
  - walking/running distance
  - active calories
  - total calories
  - sleep duration
  - workout duration
  - workout calories
  - heart rate
  - resting heart rate
  - weight
- Added idempotent `POST /device-intelligence/health-sync`.
- Added `GET /device-intelligence?dateKey=YYYY-MM-DD` daily summary.
- Added brain-ready availability flags so Personal Brain knows which health signals are actually present.
- Kept calories consumed sourced from the existing `DailyLog` instead of duplicating nutrition storage.

### Mobile

- Added vendor-neutral `HealthProvider` contract in `apps/mobile/lib/health/health-provider.ts`.
- Native providers will plug into this contract without coupling backend logic to Apple or Google.

## Architecture

```text
HealthKit / Health Connect / future wearables
                    ↓
            HealthProvider contract
                    ↓
          /device-intelligence/health-sync
                    ↓
             HealthDataPoint
                    ↓
          Daily Health Summary
                    ↓
              Personal Brain
```

## Important decisions

- Do not estimate active calories from step count when a provider already supplies an authoritative calorie metric.
- Keep active and total calories distinct.
- Preserve provider/device/sourceRecordId for provenance and deduplication.
- Do not bind the backend to HealthKit, Health Connect, Fitbit, Garmin or Oura-specific payloads.
- Native HealthKit/Health Connect integration requires a custom development/production build rather than Expo Go.

## Validation

**Pending local validation.**

Required after pulling this branch:

```bash
cd ~/My-Personal-Assistant/apps/backend
pnpm install
pnpm prisma generate
pnpm run typecheck
pnpm run build
pnpm test --runInBand
```

A database migration must also be applied before exercising the real persistence path.

## Next

1. Implement iOS HealthKit adapter.
2. Implement Android Health Connect adapter.
3. Add permission/setup UX.
4. Add incremental sync cursor and background refresh where platform policy permits.
5. Feed activity summary into Personal Brain and adaptive nutrition decisions.
6. Add workout-session detail and richer signals such as VO2 max, sleep stages and resting metrics where available.
