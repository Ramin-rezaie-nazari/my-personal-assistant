# Platform and Tests Deep Read

Last updated: 2026-09-12
Review status: SOURCE-LEVEL RECONCILED; CI VERIFIED ON REMEDIATION TREE
Scope actually read: backend/root and app package manifests; bootstrap/main/config/TS/ESLint; E2E setup/config/specs; recorded CI workflows; selected Mobile native/runtime/config clients; controller inventory; backend↔mobile contract checks; remediation CI rechecks.
Scope not yet read: deployed release settings, branch protection controls not exposed through the runtime, physical-device execution, production secrets/configuration and performance behavior.
Evidence roots: `.github/workflows/`; `apps/backend/package.json`; `apps/backend/src/main.ts`; `apps/backend/src/bootstrap.ts`; `apps/backend/test/`; `apps/mobile/package.json`; `apps/mobile/app.json`; canonical Appendix; GitHub Actions runs.
Confidence level: HIGH for recorded source/workflow evidence and CI results; MEDIUM for deployment-only controls.
Open questions: production release policy, deployed environment configuration and device-level build/runtime behavior.

## Current platform/test state

The global backend ValidationPipe contract is enforced at the application boundary, and historical inline-body/DTO issues were handled in the Appendix remediation chain. E2E preparation now follows migrations rather than relying on `prisma db push` as the source of truth. Mobile type validation includes committed test files, and the self-mutating one-time typecheck workflow was retired.

Backend CI on remediation commit `46614b36040cb839d6062dae726dc74e51ab3b96` passed dependency installation, Prisma validation/generation, migrations/idempotence, food-intelligence self-test, build, unit tests and API E2E. Mobile CI passed dependency installation, TypeScript, source tests, committed Jest specs, Expo validation and Android JS bundling.

Historical findings around duplicate/overlapping workflows, route security, undeclared TTS dependencies, stale Brain route contracts and refresh-session lifetime were remediated or explicitly reclassified in the canonical Appendix.

## Test philosophy boundary

Automated CI green proves the committed verification path, not full product behavior. Screen-level UX, offline reliability, physical-device permissions, push delivery, voice latency/model behavior, deployed database/RLS state and external price/AI provider health still require environment-specific validation.

## Conclusion

The recorded Platform/Test/CI source scope is reconciled for the current remediation baseline. Future defects require new evidence; historical closed findings should not be reopened solely because the broader MYPA Vision remains under development.
