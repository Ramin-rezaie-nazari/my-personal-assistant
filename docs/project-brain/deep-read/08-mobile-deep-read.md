# Mobile Deep Read

Last updated: 2026-09-12
Review status: SOURCE-LEVEL RECONCILED; APPENDIX REMEDIATION VERIFIED; DEVICE RUNTIME BLOCKED
Scope actually read: the recorded audit inventory covers `apps/mobile/package.json`, `app.json`, Expo Router routes and audited feature screens, API/domain clients, auth/onboarding, localization/RTL, notification and TTS helpers, yoga camera/pose contracts, design/motion/branding components, mobile scripts, committed specs and CI workflows. Subsequent remediation rechecks are recorded in the canonical Appendix and validation ledger.
Scope not yet read: production/device execution, native permission behavior on physical hardware, deployed API reachability, external provider behavior and any generated/native artifacts that cannot be meaningfully validated from the connector runtime.
Evidence roots: `apps/mobile/`; `.github/workflows/mobile-ci.yml`; canonical Appendix; `FILE_REVIEW_INDEX.md`.
Confidence level: HIGH for recorded source-level audit/reconciliation; MEDIUM for end-to-end device behavior.
Open questions: real-device UX/performance, native notification/voice behavior, offline reliability and production API configuration.

## Current reconciled state

The mobile auth transport now uses secure storage for credentials and shared authenticated request behavior with refresh/retry. Onboarding completion synchronizes authenticated backend onboarding/profile state while preserving local state. Audited localization/RTL and notification lifecycle gaps were wired into active application paths.

Voice/TTS dependencies and consumer wiring were reconciled, and TTS model preparation uses pinned revisions with checksum verification. Notification push registration/runtime/action paths have active lifecycle integration in the remediation baseline.

Price history presentation now respects the snapshot currency and derives observed bounds without a fabricated zero. Duplicate legacy branding/animation artifacts were retired where they competed with canonical contracts.

Mobile CI now validates dependency installation, TypeScript including committed test files, source tests, committed Jest specs, Expo validation and Android JS bundle generation.

## Historical findings boundary

The historical Mobile findings listed in earlier versions of this document were audit observations. Concrete findings in the canonical Appendix were remediated, withdrawn or reclassified. They must not be interpreted as current defects unless new evidence reopens them.

The remaining product-level gaps are broader than the Appendix: full offline/local-first behavior, comprehensive screen-level integration/E2E, complete accessibility, real-device UX polish, global localization depth, and mature local-AI/voice journeys are still product-development work.

## Verification boundary

Mobile CI passed on remediation commit `46614b36040cb839d6062dae726dc74e51ab3b96`. This confirms the committed automated validation pipeline, not real Android/iOS device behavior or production service connectivity.
