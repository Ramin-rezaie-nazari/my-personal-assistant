# MYPA Open Work

Last updated: 2026-09-14
Status: FITNESS FREE-FIRST CONTENT / MEDIA EXECUTION PHASE OPEN; BASE AUDIT REMEDIATION CLOSED

This file contains only currently actionable work/evidence gaps. Historical audit observations are preserved in `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` and dated deep-read/audit continuation documents; an old OPEN label in a historical catalog is not evidence that the defect still exists.

## Remaining work — Fitness content/media phase

The repository-side Fitness product foundation is implemented on the feature branch. The active phase is content scale + free/open/public-domain media discovery and authorized acquisition.

### 1. 1500-exercise catalog

- Target: **1500 canonical exercises** with complete MYPA metadata.
- Required quality gate: published status only after metadata, coaching content, cautions and source/provenance are present and reviewed.
- Important boundary: the target is not proof that 1500 fully reviewed records are already present; the catalog still needs population and verification.
- Program prescriptions should resolve to canonical published Exercise records after the catalog/import strategy is finalized.

### 2. 1000-source discovery corpus

- Discover at least **1000 distinct candidate websites/source domains/collections** for exercise demonstrations and structured exercise content.
- Larger discovery runs (10,000+ sources) are permitted when needed; 1000 is the first milestone, not a hard ceiling.
- Record domain/source URL, content type, creator/owner, exact license or permission basis, commercial-use compatibility, attribution requirements, download/API/hotlink constraints and approval status.
- Candidate discovery is not permission to copy content.

### 3. Free-first media acquisition

Priority order:

1. exact CC0/public-domain assets;
2. exact CC BY assets;
3. other compatible open licenses after obligations are reviewed;
4. government/public-domain exercise footage with asset-level checks;
5. openly licensed creator/exercise libraries;
6. free stock platforms only when the exact asset license supports MYPA's intended distribution/storage model;
7. paid vendors only as fallback if free coverage cannot satisfy the movement gap.

The repository now contains scalable discovery and rights-gated download tooling. Execute the free/open/public-domain path first and measure exact coverage against the 1500-movement target before considering paid procurement.

### 4. Rights-aware media acquisition

- Build/execute acquisition only for MYPA-owned, explicitly licensed, compatible open-license or externally authorized assets.
- Do not blanket-download BODINEXT media or arbitrary third-party exercise videos.
- Persist provenance before publication: acquisition mode, source reference, rights basis, license URL, creator, attribution, checksum, storage key, reviewer and review timestamp.
- Use the approved-media downloader only after asset-level approval.

### 5. Consumer media UX

- Add true in-app video playback after the authorized media source strategy is finalized.
- Keep external/link-only fallback explicit when an approved asset cannot be embedded safely.

### 6. Fitness analytics polish

- Add richer exercise-level program analytics.
- Add PR and volume/adherence trend views to the consumer dashboard.

## Environment-bound evidence

1. **Physical Android/iOS device validation:** complete real user journeys and verify startup/navigation, authentication/session refresh, Fitness playback, notifications, background/foreground transitions and representative data mutations.
2. **Production environment validation:** verify deployed Supabase/Auth/RLS/Storage/CDN/API behavior and real media delivery.
3. **Final evidence capture:** record device/production results in Project Brain and only then promote those capabilities from environment-limited to verified.

## Automated evidence already green on the verified baseline

- Backend CI is green through dependency installation, Prisma validation/generation, migration deployment/idempotence, food-intelligence self-test, backend build, unit tests and API E2E.
- Mobile CI is green through frozen-lockfile installation, typecheck, source tests, committed Jest specs, Expo validation and Android JavaScript bundling.
- Canonical Android native APK CI is green on `main` commit `0d19d2b7dad5e9100505205328fbd523e544445b`; workflow run `34772364209` completed through Expo prebuild, real Gradle `assembleDebug` and APK upload.

## Fitness feature branch verification boundary

The Fitness feature branch has an earlier Backend CI failure at Prisma validation recorded during development and subsequent schema fixes. The final branch head is not marked green until fresh Backend CI and Mobile CI evidence is confirmed on that final head.

## Remediation ledger — closed

- Frozen pnpm lockfile dependency graph is aligned on the verified baseline.
- Duplicate Android/EAS workflows were removed, leaving canonical workflows.
- Fitness profile/goal/equipment controller writes use nested runtime-validated DTOs and authenticated `user.id`.
- Shopping, inventory, daily tracking and habit write inputs have runtime validation.
- Assistant confirmation uses a validated DTO.
- Recipe update uses a validated update DTO.
- Price Intelligence write endpoints use validated DTOs; HTTP price normalization preserves currency semantics and currency-aware deduplication.
- Fitness natural-goal parsing uses UUID-compatible IDs and normalized Persian text handling.
- Personal Brain, Yoga, Calisthenics, Calendar, User Intelligence, Recommendation Intelligence, Decision Feedback and Memory Intelligence action boundaries use runtime DTO validation.
- Recipe inventory matching is unit-aware for compatible metric dimensions and rejects incompatible units.
- Personal Brain application bootstrap resolves `DecisionExecutionCoordinatorService` through runtime DI metadata.
- Mobile brain-execution credentials use `expo-secure-store` rather than AsyncStorage.
- PB-258 through PB-268 are recorded as CLOSED — REMEDIATED in the canonical findings appendix.

## Completion rule

A work item is green only after implementation, relevant automated validation and documentation are consistent. Device/production evidence stays explicitly unvalidated until exercised outside repository CI.
