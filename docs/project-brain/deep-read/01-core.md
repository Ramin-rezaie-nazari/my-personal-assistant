# Core Deep Read

Last updated: 2026-09-12
Review status: RECONCILED FOR RECORDED CORE SCOPE; APPENDIX REMEDIATION VERIFIED
Scope actually read: complete identified current source files under Auth, Users, Profile, Preferences, Onboarding, Settings, Context Engine, Device Intelligence and User Intelligence, with the recorded audit batches covering the Core scope and subsequent remediation rechecks.
Scope not yet read: no known additional Core source gap remains in the recorded deterministic audit scope; production/device behavior remains outside repository-source evidence.
Evidence roots: `apps/backend/src/modules/auth/`; `users/`; `profile/`; `preferences/`; `onboarding/`; `settings/`; `context-engine/`; `device-intelligence/`; `user-intelligence/`; `docs/project-brain/FILE_REVIEW_INDEX.md`.
Confidence level: HIGH for recorded source reads and current auth/remediation revalidation; MEDIUM for dynamic runtime semantics requiring deployment execution.
Open questions: production identity/configuration, real-device integrations, and broader product capabilities described by the Vision but not yet implemented as complete journeys.

## Auth

Passwords are hashed with Argon2 and registration rejects an existing email. Login rejects absent/invalid credentials. Evidence: `apps/backend/src/modules/auth/auth.service.ts`.

Access and refresh tokens use separate configured secrets. Refresh tokens carry `type: 'refresh'`, and token creation now adds a unique `jti` via `randomUUID()` to prevent rapid issuance from collapsing to the same JWT. Evidence: `apps/backend/src/modules/auth/utils/token.utils.ts`.

Refresh verifies the token signature/type, resolves the persisted session using a SHA-256 refresh-token hash with `expiresAt > now`, loads the user, issues a new pair, and atomically rotates the current persisted session. A second attempt to rotate the already-consumed token returns `null` and is rejected. Evidence: `apps/backend/src/modules/auth/auth.service.ts`; `apps/backend/src/modules/auth/services/session.service.ts`.

## Users / account foundation

The active users controller/service path is reconciled with authenticated profile access and application account-erasure behavior. Duplicate/stale controller artifacts identified by the historical audit were retired or made non-competing in the active module graph. Evidence: `apps/backend/src/modules/users/` and Appendix findings PB-191/PB-213/PB-211.

## Profile / Preferences / Onboarding / Settings

These modules remain separated by responsibility and backed by Prisma. Runtime validation and bounded DTO contracts are part of the remediation baseline where the historical audit identified them. Onboarding completion synchronizes authenticated backend state from the mobile flow while preserving the local presentation state.

Settings persists user language/timezone, which is consumed by downstream date-window and localization-sensitive services. Evidence: settings/onboarding source and related Appendix findings PB-207/PB-215/PB-221/PB-247.

## Context Engine

The source audit reconciled fusion/priority behavior and removed stale empty controller/module artifacts from active registration where they conflicted with canonical paths. Context semantics remain part of the central decision architecture rather than an independently assumed HTTP contract.

## Device Intelligence

Device intelligence has authenticated boundaries in the active controller path. Native health/device-provider behavior remains a future integration boundary; repository source should not be interpreted as evidence of production wearable/health synchronization.

## User Intelligence

Behavior learning persists user events and derives deterministic insights. Time/window calculations use the user's persisted timezone where event metadata is absent. Placeholder profile-provider artifacts identified by the audit were removed from the active module graph.

## Core audit conclusion

The recorded Core source scope is reconciled. Historical Core defects captured in the Appendix were remediated or reclassified and no active duplicate finding is created merely because the future MYPA Vision contains capabilities that are not yet implemented. Runtime/deployed/device validation remains explicitly outside this document's source-level closure claim.
