# PB-255 — Local recipe image pipeline invokes a missing status script

- Status: PROVISIONAL — operational-script contract finding.
- Location: `apps/backend/scripts/recipe-images-local-guaranteed-v8.mjs`
- Problem: The script unconditionally invokes `./scripts/recipe-images-local-status.mjs` as its final `run('final-status', ...)` step, but repository search on audited main finds only the caller and no source file at that path.
- Evidence: repository search for the exact executable name returns the `recipe-images-local-guaranteed-v8.mjs` caller only; the caller contains `await run('final-status', './scripts/recipe-images-local-status.mjs', {}, false)`. fileciteturn274file0
- Impact: Running the local guaranteed image pipeline cannot complete its final status phase and may fail or report an incomplete pipeline depending on the helper's error policy. This is distinct from PB-251 because PB-251 is the package-script-to-missing-retry-script contract; PB-255 is an internal script-to-script dependency.
- Reconciliation: Verify whether this v8 pipeline is intentionally retired/deprecated or whether the status script was omitted. Do not merge solely because both are recipe-image operational gaps.
