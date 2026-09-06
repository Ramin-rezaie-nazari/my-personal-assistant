# 2026-09-06 — Media + Wearable Integration Audit

## Recipe media — actual status

The mobile recipe detail route already renders:

- a hero recipe image from `presentation.imageUrl` / `recipe.imageUrl`;
- an approved recipe gallery from `presentation.media[].url`;
- step images from `presentation.steps[].imageUrl`.

The backend presentation service joins approved `RecipeMedia` rows and returns their URLs plus provenance/license fields.

Therefore the **UI/data contract is implemented**. This does **not** prove that the production/local database currently contains a complete verified recipe corpus with images. The current project state explicitly keeps the full recipe corpus runtime import/audit unverified.

## Fitness media — actual status

The mobile exercise route renders `FitnessItem.media[].webpUrl` and reports actual-vs-required coverage. The backend/catalog contract expects approved WebP media, with four assets as the release-quality target.

Therefore the **UI/data contract is implemented**. The full 1,500-movement / 6,000-approved-WebP corpus is still not claimed populated until the importer, database, audit and media-verification gates pass against the actual runtime database.

## Wearables / smart watches — actual status

The existing `DeviceIntelligenceModule` is now an explicit integration-status boundary, not a fake data provider. The authenticated `GET /device-intelligence` endpoint reports that native providers are not configured and deliberately returns no synthetic steps, calories or sleep values. `HealthSyncService` also refuses to report a successful sync while the native layer is unavailable.

The correct scalable strategy is not to build a bespoke integration for every watch brand. Use platform health hubs:

- Apple HealthKit / Health app on iOS/watchOS.
- Android Health Connect on Android.

These platforms can aggregate data supplied by device/companion ecosystems, subject to what each ecosystem exposes and what the user authorizes.

## Data that MYPA should ingest

- steps
- active calories burned
- total energy where exposed or derivable
- distance
- sleep duration
- heart-rate summaries where exposed
- workouts (type/start/end/duration/energy/distance)
- selected body metrics where permitted
- source/device provenance
- external record IDs and timestamps for deduplication

## Provider-neutral implementation boundary

The mobile layer now defines:

`native provider → HealthProviderAdapter → normalized HealthSample → backend sync`

This keeps the business logic independent from HealthKit, Health Connect, or a particular watch vendor. The normalized contract also defines incremental-sync and deduplication requirements.

## Personal Brain path

The intended lifecycle is:

`Wearable / health hub`
`→ native provider bridge`
`→ normalized health sync contract`
`→ durable user-owned activity records`
`→ dashboard / nutrition / fitness / reminders`
`→ Personal Brain context`
`→ deterministic recommendations`

User-entered meal calories remain intake evidence. Device energy expenditure remains imported/estimated evidence and must not silently overwrite user-entered nutrition records.

## Why this remains a release gate

HealthKit requires explicit permissions and the HealthKit capability; Apple also requires appropriate privacy usage descriptions. HealthKit supports background/long-running queries, but the app must handle permission changes and limited access.

Health Connect requires declared record-type permissions plus runtime authorization. Its current React Native package supports Expo custom builds but not Expo Go, so native dependency/configuration and a custom development/release build are required.

A production-grade native integration therefore requires dependency/native build changes and physical-device validation. It is deliberately not marked green from source-only inspection.

## Current decision

**Recipe images:** UI path GREEN, corpus population YELLOW.

**Exercise images:** UI path GREEN, full corpus population YELLOW.

**Wearable architecture:** GREEN at the contract/boundary level; native providers and durable sync remain RED/PENDING until implementation and real-device validation exist.

## Evidence note

The latest Android workflow after the mobile health changes failed during dependency installation before typecheck/prebuild/Gradle, so no Android build claim is inferred from this architecture work. See `docs/RELEASE_READINESS.md`.

## Source references

See the corresponding Apple and Android official platform documentation in the engineering session record and `docs/RELEASE_READINESS.md`.
