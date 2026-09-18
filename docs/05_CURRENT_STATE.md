# MYPA Current State

Last updated: 2026-09-18
Review status: MULTILINGUAL + GLOBAL PRICE FOUNDATIONS IMPLEMENTED / RUNTIME DEVICE VERIFICATION PENDING

## Canonical ownership

This root file is the canonical repository-wide current-state document. `apps/backend/docs/05_CURRENT_STATE.md` is a compatibility pointer and must not contain a competing project-state snapshot.

## Repository state

- Repository: `Ramin-rezaie-nazari/my-personal-assistant`
- Target canonical branch: `main`
- Latest fully verified functional baseline before the current feature slice: `0d19d2b7dad5e9100505205328fbd523e544445b`
- Subsequent commits now include the Exercise Content/Media foundation and the Global Multilingual Assistant foundation; those new slices require fresh CI/device verification before they can be treated as fully verified.
- Scope of the latest previously verified baseline: audit remediation, request-boundary hardening, security/privacy reconciliation and final CI/native verification.

## Remediation completed in verified baseline

- Major audit remediation PR #71 is merged.
- Frozen pnpm lockfile is aligned with the workspace dependency graph.
- Duplicate Android/EAS workflow definitions were removed; canonical APK and EAS preview paths remain.
- Missing shopping DTO contract exposed by CI was restored.
- Runtime DTO validation was added across the previously identified unvalidated action/write boundaries.
- Fitness authenticated identity uses `req.user.id` and Fitness persistence is Prisma-backed.
- Fitness natural-goal IDs are UUID-compatible and Persian text handling is normalized.
- Price normalization preserves currency semantics and currency-aware deduplication.
- Personal Brain, Yoga, Calisthenics, Calendar, User Intelligence, Recommendation Intelligence, Decision Feedback and Memory Intelligence action boundaries have runtime DTO validation.
- Recipe inventory matching is unit-aware for compatible metric mass/volume/count units and rejects incompatible dimensions rather than making false numeric matches.
- Personal Brain runtime DI metadata was hardened so the full application bootstrap can resolve `DecisionExecutionCoordinatorService`.
- Mobile brain-execution credentials use `expo-secure-store` with device-only keychain accessibility and clear both credentials after refresh failure.
- Security/privacy documentation was reconciled to current remediation evidence.
- Audit findings PB-258 through PB-268 are recorded in the canonical appendix and were closed/remediated in the previous verified slice.
- Android Expo SDK 53 autolinking is explicitly pinned through `apps/mobile/react-native.config.js`, with the supporting pnpm hoisting remediation retained.

## Exercise Content/Media foundation — pending fresh verification

- Canonical `Exercise`, `ExerciseMedia` and `ExerciseRelationship` Prisma models were added as a multi-file schema slice.
- A migration was added for the new exercise content/media tables and indexes.
- Authenticated read APIs were added for exercise listing/search/filtering and exercise detail.
- Exercise media now carries provider, license, attribution, approval status, dimensions, duration, poster and checksum metadata.
- Existing fitness generators are intentionally not yet rewritten against the new catalog; that integration follows runtime verification of this foundation.

## Global Multilingual Assistant foundation — pending fresh verification

- The canonical UI language registry continues to contain exactly 51 base languages.
- Azerbaijani Turkish in Iran is represented as a separate regional locale (`az`) while Turkish (Türkiye) remains `tr`.
- Mobile translation now supports a bidirectional bridge between the selected locale and the canonical assistant language.
- Assistant chat sends user input through the selected-locale → canonical-language gateway and translates assistant responses back before rendering.
- Assistant TTS now follows the selected app locale rather than a Persian/English-only switch.
- The backend local assistant provider no longer emits hard-coded Persian response strings; canonical assistant responses are language-neutral English so the mobile gateway has a stable source language.
- `docs/project-brain/18_GLOBAL_MULTILINGUAL_ASSISTANT.md` is the canonical architecture and quality contract for this feature.

## Automated evidence for the previously verified baseline

### Backend CI — GREEN on previous baseline

The latest previously verified Backend CI line completed successfully through dependency installation, Prisma schema validation/generation, migration deployment and idempotence, food-intelligence self-test, backend build, unit tests and API E2E tests.

### Mobile CI — GREEN on previous baseline

The latest previously verified Mobile CI line completed successfully through dependency installation, mobile typecheck, source tests, committed Jest specs, Expo project validation and Android JavaScript bundling.

### Android native APK — GREEN on previous baseline

The canonical native evidence path is `.github/workflows/android-apk.yml`. Workflow run `34772364209` (run #79), head `0d19d2b7dad5e9100505205328fbd523e544445b`, completed successfully through Expo prebuild, real Gradle `assembleDebug`, and APK upload.

## Evidence limitations

- The Exercise Content/Media foundation has not yet received fresh CI evidence after its commits.
- The Global Multilingual Assistant foundation has not yet received fresh CI evidence after the current commits.
- Translation-model availability and TTS voice availability for every locale remain device/OS capabilities and cannot be proven from repository source alone.
- Real physical-device UX remains unvalidated, including RTL rendering, locale-specific speech, translation model availability, startup language switching and dynamic-content translation.
- Production deployment behavior, production Auth/RLS/Storage configuration and real notification delivery remain environment-limited.
- Direct local repository execution is unavailable in the remediation container; local PostgreSQL startup and real daily price collection still require the user's laptop environment.
- These are explicit evidence limits, not silently marked green findings.

## Project Brain

`docs/project-brain/12_OPEN_WORK.md` contains current actionable work/evidence gaps. `docs/project-brain/16_BODINEXT_TO_MYPA_FEATURE_MAPPING.md` is the reference-product gap analysis. `docs/project-brain/17_EXERCISE_CONTENT_MEDIA_IMPLEMENTATION.md` documents the exercise/media foundation. `docs/project-brain/18_GLOBAL_MULTILINGUAL_ASSISTANT.md` documents the multilingual language contract and implementation boundary. Historical audit observations remain preserved in `15_AUDIT_FINDINGS_APPENDIX.md` and dated continuation documents. `10_SECURITY_AND_PRIVACY.md` must remain synchronized with the same verification boundary.

## Global Daily Price Intelligence — implemented, local runtime verification pending

- The global Open Prices + FAO FPMA provider layer is implemented.
- Open Prices is the daily global feed; its ingestion default is bounded to a two-day recent window.
- FAO FPMA is retained as a monthly benchmark/reference provider and is excluded from default daily collection.
- `PriceCoverageService` reports daily coverage against Open Prices by default across the canonical 195-country registry.
- `apps/backend/src/scripts/local-price-scheduler.ts` is the canonical development scheduler and runs on the laptop in its local timezone.
- `docker-compose.local.yml` provides the persistent local PostgreSQL database.
- No Supabase dependency and no cloud price scheduler are part of the current development architecture.
- Price persistence reports actual inserted rows and includes city/market context in fallback snapshot identity.
- `docs/project-brain/19_GLOBAL_DAILY_PRICE_INTELLIGENCE.md` is the canonical price-intelligence contract.

Backend CI for the local-first infrastructure PR completed successfully, including backend API E2E. Real laptop execution and measured country coverage remain environment-dependent.

## Local-first infrastructure decision — 2026-09-18

- Supabase is not a development or production dependency for the current MYPA architecture.
- Local PostgreSQL is the canonical development database.
- `docker-compose.local.yml` provides the persistent PostgreSQL container.
- `apps/backend/src/scripts/local-price-scheduler.ts` owns daily global price scheduling on the development laptop.
- VPS deployment is intentionally deferred until the release phase.
- CI may use ephemeral PostgreSQL for automated validation only.

## Infrastructure policy — local-first

Supabase is not part of the current canonical development architecture. Use local PostgreSQL + Prisma during development; defer VPS deployment until release. Legacy scripts that still mention Supabase are tracked separately for retirement/migration and are not part of the target runtime path.
