# MYPA Current State

Last updated: 2026-09-11
Review status: IN_PROGRESS

## Audit governance

This root-level file is the canonical location required by the MYPA audit protocol for current project state. It is intentionally kept separate from the legacy/operational document at `apps/backend/docs/05_CURRENT_STATE.md` until those two documents are reconciled.

## Current audit status

- Repository: `Ramin-rezaie-nazari/my-personal-assistant`
- Audit branch: `audit/project-brain-2026-09-11`
- Initial branch head observed during this session: `9e044717f0b9fbf69612363f65a5cfb0a1b514f2`
- Audit is IN_PROGRESS.
- No production-code modification has been made by this session; work on this branch is documentation/audit-only.
- BATCH-0013 is focused on `apps/backend/scripts/`, beginning with package-wired scripts and then legacy/duplicate operational variants.

## Verified scope in this session

- Required Project Brain overview/architecture/open-work/decision-log documents were re-read from the audit branch.
- `apps/backend/package.json` was inspected to identify the package-wired operational recipe/food scripts.
- Recipe content import, recipe image import/dataset/reprocess variants, country intelligence variants, food entity resolvers/self-tests, recipe intelligence classify/profile/ingredients/nutrition/score, local image pipeline variants, and relevant recipe migrations were inspected.
- `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` was updated through PB-204.

## Important verified findings in this continuation

- PB-186..PB-190 were confirmed present before continuing.
- PB-191: the protocol-mandated root `docs/05_CURRENT_STATE.md` was missing; it has now been created, but reconciliation with `apps/backend/docs/05_CURRENT_STATE.md` is still open.
- PB-192: `recipe-content-import.mjs` has no offset/checkpoint and repeatedly processes only the first `BATCH_SIZE` dataset rows.
- PB-193: `recipe-content-import.mjs` performs related writes without a transaction, allowing partial persistence on late failure.
- PB-194: multiple image import paths hard-limit WebP to 60KB versus the project target of approximately 100–150KB.
- PB-195: multiple country-intelligence versions remain executable, while only the final variant is package-wired.
- PB-196: recipe image quality reprocessing LIMIT is positional and not restartable.
- PB-197: image importer variants use conflicting `primary` versus `hero` image contracts.
- PB-198: a final food-intelligence self-test exists but is not exposed through the inspected package/CI automation path.
- PB-199: recipe ingest stores quality as a fractional 0..1 score while recommendation scoring divides positive values by 100, nearly nullifying the quality contribution.
- PB-200: nutrition estimation uses hard-coded nutrient constants/household conversions without source/version provenance; outputs are explicitly marked estimated.
- PB-201: dataset RESET lists at most the first 1000 Storage objects but globally deletes matching DB rows, risking orphaned Storage objects on larger datasets.
- PB-202: wired recipe image import paginates recipes but not existing primary-image/skip-attempt state, so rows beyond 1000 can be treated as missing/unattempted.
- PB-203: local guaranteed-v8 image orchestration references three exact script paths that do not exist in the audited branch, making the orchestration entrypoint broken.
- PB-204: country preference scoring expects `iso2/country/region` on relation rows but both classify and recommendation scripts select only `recipe_id,country_id,relation_type,confidence,evidence`, so preferred-country/region matching is silently ineffective.

## Validation state

Source-level inspection has been performed for the listed files. Runtime execution, live database state, working-tree dirtiness outside GitHub-visible branch state, physical-device validation, and end-to-end production behavior are not established by this session and must not be inferred from this document.

## Progress accounting

Do not use the legacy `apps/backend/docs/05_CURRENT_STATE.md` percentage as authoritative. A trustworthy repo-wide completion percentage is not recalculated in this continuation because the complete remaining source/test/consumer inventory and runtime validation gates are not yet closed.

## Next audit step

Continue BATCH-0013 through the remaining legacy/duplicate operational script families, then complete route↔DTO↔test↔mobile reconciliation and repository-wide database/transaction/security/privacy matrices. Do not begin broad finding remediation until the Master Prompt audit scope is fully closed, except for any issue requiring immediate safety containment.
