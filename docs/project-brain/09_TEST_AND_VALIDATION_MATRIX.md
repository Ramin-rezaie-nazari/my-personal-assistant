# Test and Validation Matrix

Last updated: 2026-09-12
Review status: VERIFIED FOR COMMITTED CI GATES; DEVICE/PRODUCTION VALIDATION BLOCKED
Scope actually read: backend/mobile package scripts, test directories, E2E setup/specs, CI workflows and recorded workflow-run evidence for the remediation tree.
Scope not yet read: deployed environment, physical-device execution, production provider behavior and performance/load validation.
Evidence roots: `apps/backend/package.json`; `apps/mobile/package.json`; `apps/backend/test/`; `.github/workflows/`; GitHub Actions runs for remediation commit.
Confidence level: HIGH for committed CI behavior/results; MEDIUM for deployment/device validation.
Open questions: production/device execution and external-provider integration behavior.

## Validation gates

| Area | Result | Evidence |
|---|---|---|
| Backend dependency installation | PASS | Backend CI run `34685084158` |
| Prisma schema validation/generation | PASS | Backend CI run `34685084158` |
| Database migrations + idempotence | PASS | Backend CI run `34685084158` |
| Food-intelligence self-test | PASS | Backend CI run `34685084158` |
| Backend build | PASS | Backend CI run `34685084158` |
| Backend unit tests | PASS | Backend CI run `34685084158` |
| Backend API E2E | PASS | Backend CI run `34685084158` |
| Mobile dependency installation | PASS | Mobile CI run `34685084152` |
| Mobile TypeScript | PASS | Mobile CI run `34685084152` |
| Mobile source tests | PASS | Mobile CI run `34685084152` |
| Mobile committed Jest specs | PASS | Mobile CI run `34685084152` |
| Expo validation | PASS | Mobile CI run `34685084152` |
| Android JS bundle | PASS | Mobile CI run `34685084152` |
| Physical Android/iOS device behavior | BLOCKED | Not available in connector runtime |
| Deployed DB/RLS/Storage/Auth | BLOCKED | Not available in connector runtime |
| Production push/voice/external providers | BLOCKED | Requires deployed/device environment |

## Validation boundary

The green CI results verify the committed automated validation pipeline on remediation commit `46614b36040cb839d6062dae726dc74e51ab3b96`. They do not establish production readiness, offline behavior, device permissions, push delivery, external price/AI provider health or UX quality.
