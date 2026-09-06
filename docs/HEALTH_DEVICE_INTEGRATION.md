# MYPA Health & Wearable Integration Contract

Updated: 2026-09-06

## Product behavior

MYPA should not attempt to maintain a direct native integration for every smartwatch vendor. The cross-platform strategy is to consume the operating-system health hubs that aggregate data from device/companion ecosystems:

- iOS / watchOS: Apple HealthKit / Health app.
- Android: Android Health Connect.

This does not mean every watch is guaranteed to expose every metric. Availability depends on what the device/companion app writes into the platform health store and what the user grants MYPA permission to read.

## Normalized data contract

MYPA's product-level health context should normalize provider records into these concepts:

- steps
- active calories burned
- total calories burned where exposed or derivable
- distance
- sleep duration
- resting/average heart rate where exposed
- workouts: type, start/end, duration, energy, distance
- body measurements where available and explicitly permitted
- source/provider/device metadata
- observed start/end timestamps

Raw provider identifiers should remain provider-specific and must not become business-logic keys.

## Source-of-truth rule

Provider data is external evidence, not an unquestioned truth. Each imported record must retain:

- provider/source
- optional external record ID
- start/end timestamps
- imported-at/update timestamp
- normalized values
- source metadata

Deduplication and conflict behavior must be deterministic. MYPA should never silently add the same wearable record twice.

## Brain integration

The normalized activity layer should feed the Personal Brain as context, not directly overwrite user-entered logs.

Examples:

- Activity calories can inform daily energy context.
- Imported workouts can appear alongside MYPA-created workouts.
- Steps and sleep can influence recommendations and reminders.
- User-entered meal calories remain the authoritative intake log.
- Device-estimated energy expenditure must remain clearly labeled as imported/estimated.

The daily dashboard can then present a coherent picture such as:

`Food logged → calories consumed`

`Workout/device → calories burned`

`Steps → movement`

`Sleep → recovery`

`Goals → progress`

## Privacy and store gate

Health data is sensitive. The app must request only the minimum data types needed, handle revocation/limited access, and explain usage clearly.

Apple HealthKit requires explicit per-data-type authorization and the HealthKit capability plus privacy usage descriptions. HealthKit also supports background/long-running queries for changes. See Apple's official documentation.

Android Health Connect requires manifest permissions and runtime authorization for each requested record type. Play Store release requires the appropriate Health Connect data-access declaration in Play Console.

## Implementation status

- **GREEN:** Product architecture recognizes device/health data as a normalized domain and the backend exposes a protected `DeviceIntelligenceModule` integration-status boundary.
- **GREEN:** Mobile has a provider-neutral health sample contract and native-adapter boundary so HealthKit/Health Connect can be added without coupling business logic to a vendor.
- **GREEN:** The backend no longer returns synthetic zero health metrics and no longer reports a false successful sync while native providers are unavailable.
- **YELLOW:** Backend persistence for imported health samples/checkpoints and deterministic deduplication is not yet implemented.
- **PENDING:** Native iOS HealthKit bridge + permissions + read/query/sync flow.
- **PENDING:** Native Android Health Connect bridge + permissions + read/query/sync flow.
- **PENDING:** Offline-first incremental sync/checkpointing and dedupe validation.
- **PENDING:** Physical iOS/Android validation with representative wearable ecosystems.

## Important limitation

There is no honest product claim of “all smartwatches supported directly.” The defensible claim is “supports health/wearable data through Apple HealthKit and Android Health Connect,” subject to the data those ecosystems expose.
