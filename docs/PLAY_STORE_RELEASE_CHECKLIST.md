# MYPA — Play Store Release Checklist

این checklist مرز بین کارهای قابل انجام داخل repository و gateهای بیرونی انتشار را مشخص می‌کند.

## Repository / engineering gates

- [x] Android application id is explicitly configured.
- [x] Android `versionCode` is explicitly configured.
- [x] iOS build number is explicitly configured.
- [x] Expo production distribution is configured as `store` in `eas.json`.
- [x] Camera permission copy is explicitly configured.
- [x] Microphone permission copy is explicitly configured.
- [x] Foreground location permission copy is explicitly configured.
- [x] Backend health endpoint probes database readiness and returns HTTP 503 when unavailable.
- [x] Backend graceful shutdown hooks are enabled.
- [x] Refresh-token rotation/replay rejection is implemented.
- [x] New refresh tokens are stored as SHA-256 fingerprints at rest, with compatibility for legacy sessions.
- [x] Local validation commands are documented and exposed from the root package.
- [ ] Android native build completes successfully on the current branch and produces a verified APK/AAB artifact.
- [ ] Android release build is inspected for runtime startup, navigation and permissions on a real device.
- [ ] Persian TTS is validated on representative physical Android devices without native crash.
- [ ] Yoga camera/pose provider is connected and physically validated.
- [ ] Fitness corpus passes the real local database import/audit/media gates.
- [ ] Recipe corpus passes the real local database import/audit gates.
- [ ] Full mobile localization/theme/accessibility audit is green.
- [ ] Production backend deployment target and database migrations are verified.

## Play Console / external gates

- [ ] Google Play developer account is ready.
- [ ] App signing / Play App Signing is configured.
- [ ] Production AAB is generated and uploaded.
- [ ] Store listing title, short description, full description and category are finalized.
- [ ] App icon and required promotional/store graphics are finalized.
- [ ] Phone/tablet screenshots are prepared for the actual release build.
- [ ] Content rating questionnaire is completed.
- [ ] Data Safety form is completed from the final production data flows.
- [ ] Privacy policy is publicly hosted and its URL is entered in Play Console.
- [ ] App access instructions are supplied if reviewers need authentication.
- [ ] Ads declaration is completed if the production app contains ads.
- [ ] Target audience and content declarations are completed.
- [ ] Countries, pricing and distribution are configured.
- [ ] Internal testing track passes before production rollout.
- [ ] Production rollout is staged/monitored.

## Non-negotiable evidence rules

A Play Store submission is not considered "ready" merely because the JavaScript bundle builds. Release readiness requires a successful native release artifact, real-device smoke testing, backend production configuration, and completion of the Play Console declarations.
