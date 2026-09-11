# PB-255 — Local recipe image pipeline invokes missing internal scripts

- Status: PROVISIONAL — operational-script contract finding.
- Location: `apps/backend/scripts/recipe-images-local-guaranteed-v8.mjs`
- Problem: The v8 local recipe-image pipeline invokes multiple internal executables that are not present on audited main: `recipe-images-local-guaranteed-v7.mjs`, `recipe-images-local-strict-v3.mjs`, and `recipe-images-local-status.mjs`.
- Evidence: exact repository searches on audited main return the v8 caller only for the missing helper names. The v8 script explicitly invokes the v7 dataset stage, strict-v3 resolver, and status script. All three helper files are present on `agent/mypa-autonomous-control-plane`, establishing a branch-lineage discrepancy rather than proving the references are typos.
- Impact: The v8 pipeline cannot execute its declared internal stages on current main. Depending on the helper's failure policy, it will stop at the first missing stage or continue with a degraded/incomplete pipeline.
- Reconciliation: Verify whether v8 is intentionally retired/deprecated or whether the referenced versioned scripts were omitted during branch/merge cleanup. Keep distinct from PB-251: PB-251 concerns the package-script `recipe-images:retry-quality` pointing to a missing executable; PB-255 concerns internal dependencies of the v8 local pipeline. Branch presence does not by itself establish intended merge status.
- Audit-only note: no production code changed.