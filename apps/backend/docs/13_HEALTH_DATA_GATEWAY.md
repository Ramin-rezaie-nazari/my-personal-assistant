# Health Data Gateway

## Goal

Provide one vendor-neutral health data layer for Apple HealthKit, Android Health Connect, and future wearable providers.

## Normalized data types

- steps
- distance_walking_running
- active_calories
- total_calories
- sleep_duration
- workout_duration
- workout_calories
- heart_rate
- resting_heart_rate
- weight

## Architecture

```text
Apple HealthKit ─────┐
                     ├── Mobile HealthProvider ──> POST /device-intelligence/health-sync
Android HealthConnect┘                                      |
                                                            v
                                                   HealthDataPoint
                                                            |
                                                            v
                                               Daily Health Summary
                                                            |
                                                            v
                                                   Personal Brain
```

## Design rules

1. The backend stores normalized observations, not vendor-specific payload shapes.
2. Every point keeps provider, device, sourceRecordId, unit, startAt and endAt for provenance and deduplication.
3. Sync is idempotent through `(userId, provider, dataType, sourceRecordId)`.
4. The app must preserve raw source metadata when useful, but the decision engine consumes normalized fields.
5. Active calories and total calories are distinct. Total calories can include basal energy; active calories should not be treated as total energy expenditure.
6. The system never invents calories from steps when a provider supplies an authoritative calorie metric. Estimation can be a separate, confidence-scored fallback later.
7. Health data is sensitive. Access is explicit, source-aware and user-scoped.
8. Native integrations require a development/production build; Expo Go is not the target for HealthKit/Health Connect integration.

## First backend slice

- Prisma `HealthDataPoint` persistence.
- Idempotent health sync endpoint.
- Daily health summary endpoint.
- Brain-ready context flags showing which activity metrics are actually available.
- Mobile vendor-neutral provider contract.

## Next slice

Implement native providers:

- iOS HealthKit provider.
- Android Health Connect provider.
- Permission UX.
- Incremental sync with a stored last-sync cursor.
- Background/periodic refresh where supported.
- Source conflict resolution and duplicate handling.
- Workout/session normalization.
- Feed the summary into Personal Brain and nutrition target adaptation.
