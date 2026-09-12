# Security and Privacy

Last updated: 2026-09-12
Review status: SOURCE-LEVEL RECONCILED; APPENDIX REMEDIATION VERIFIED; DEPLOYMENT VALIDATION BLOCKED
Scope actually read: recorded Auth/Core/account/controller/DTO source; global validation/config; Device/Fitness/Dashboard/Notification/Personal Brain boundaries; mobile credential/session storage and transport; CI permissions/workflows; operational scripts with service-role access; retention/account-erasure and ownership surfaces.
Scope not yet read: deployed DB/RLS/Storage/Auth configuration, physical-device privacy behavior, production edge controls and live penetration/load validation.
Evidence roots: `apps/backend/src/`; `apps/backend/prisma/`; `apps/backend/scripts/`; `apps/mobile/`; `.github/workflows/`; canonical Appendix.
Confidence level: HIGH for source/remediation and committed CI evidence; MEDIUM for deployment-only security controls.
Open questions: production edge rate limiting, RLS/Storage configuration, external provider access, device permission/privacy behavior.

## Verified mechanisms

- Argon2 password hashing/verification is active.
- Access and refresh JWTs use separate configured secrets; refresh tokens carry `type: 'refresh'` and unique `jti` values.
- Refresh sessions persist one-way SHA-256 token hashes, enforce expiry and rotate atomically.
- Global ValidationPipe uses whitelist/forbid/transform semantics.
- Environment validation requires the core DB/JWT secrets.
- Mobile auth credentials use platform secure storage rather than AsyncStorage in the remediated baseline.
- Authenticated account erasure removes the application user graph and sessions transactionally.

## Appendix remediation state

Historical security findings PB-170/PB-171/PB-172/PB-173/PB-182/PB-187/PB-189/PB-200/PB-208/PB-209/PB-211/PB-240 and related duplicate/reclassified items were addressed or explicitly reclassified in `15_AUDIT_FINDINGS_APPENDIX.md`. They should only be reopened with new evidence.

## Remaining security work

Production security is not fully green until deployed DB/RLS/Storage/Auth configuration, logging, edge abuse controls, external secret boundaries and real-device privacy behavior are inspected in their real environment. These are environmental/product hardening tasks, not silently assumed PASS from source CI.

## Verification

Backend and Mobile CI passed on the verified remediation tree. Production deployment security remains BLOCKED/UNVERIFIED outside this connector runtime.
