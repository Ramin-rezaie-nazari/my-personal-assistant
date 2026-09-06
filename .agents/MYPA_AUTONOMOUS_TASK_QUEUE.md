# MYPA Autonomous Task Queue

Updated from the autonomous control-plane audit on 2026-09-06.

## P0 — Release/Crash blocker

### Voice native crash
- Current evidence: some local Persian voices work while others crash the Android process with native SIGABRT / destroyed pthread mutex.
- Required: root-cause isolation, native lifecycle/thread/resource audit, fix, physical-device retest, regression matrix for all voices.
- Do not mark voice stable until device evidence is green.

## P0/P1 — Mobile native build gate

### Android SDK 53 dependency resolution
- Previous run reproduced `expo.core.ExpoModulesPackage` compilation failure under pnpm isolated linking.
- Repository switched to `node-linker=hoisted` and the Android workflow was aligned to the same Expo prebuild contract.
- Required: completed Gradle assemble + APK artifact verification on the corrected configuration.

## P1 — Recommendation Intelligence

- Backend Recommendation Intelligence is implemented on the canonical `FoodOperatingLoopService`.
- Mobile Smart Meals consumes the authenticated backend recommendation contract instead of maintaining an independent displayed ranking.
- Focused backend and E2E validation was already green locally before the latest mobile integration work.
- Remaining: complete mobile runtime/device validation and retire/explicitly scope any unused local meal-intelligence helper.

## P1 — Global market integration

- Global Market / Price Intelligence work exists on stacked PRs and is not on `main`.
- PR #48 has documented merge conflicts; PR #49 is mergeable only against its historical feature base.
- Current autonomous branch diverges substantially from that feature line, so do not force-merge it.
- Required: selective integration of still-relevant market-source, scheduling, FX and confidence components after dependency and regression review.

## P1 — Data / food intelligence

- canonical ingredient taxonomy
- region/cuisine normalization
- verified recipe corpus
- provenance/versioning
- allergens/dietary coverage
- runtime migration/seed validation
- canonical linkage into recipe/inventory/recommendation matching

## P2 — Mobile product

- production auth UX
- onboarding persistence + polish
- home/dashboard
- nutrition journey
- recipe/cooking flow
- pantry/inventory
- shopping
- fitness stack
- habits/reminders/calendar/supplements
- Brain chat/coach
- global settings
- offline/local-first behavior
- accessibility/responsive polish
- physical-device validation

## P1/P2 — Gender-aware theme

- Reactive provider and default/feminine theme policy are implemented.
- Home shell consumes theme context.
- Theme refresh is now also tied to route changes so onboarding/settings transitions re-read the persisted preference.
- Remaining: broaden token adoption across the rest of the mobile UI and validate default/female flows on physical devices.

## P1 — Production hardening

- authorization/RLS audit
- rate limits/abuse controls
- observability
- realistic database/performance testing
- background job reliability
- notifications reliability
- backup/restore
- disaster recovery
- privacy/data retention
- migration discipline
- deployment runbook
- cost/fallback policy
- resolve Jest E2E worker teardown warning
- review refresh-token/session storage and rotation safety

## P3 — Business / monetization

Implement only after core user journey is strong and release-ready.

## Agent rule

At each session read `MYPA_START_HERE.md`, then `apps/backend/docs/05_CURRENT_STATE.md`, reconcile it against code and CI, and choose the highest-priority unblocked item. Evidence beats status text.