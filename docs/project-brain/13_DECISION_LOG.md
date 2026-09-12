# Decision Log

Last updated: 2026-09-12
Review status: MASTER PROMPT DEVELOPMENT IN PROGRESS
Scope actually read: audit governance, source-audit reconciliation, remediation decisions, CI verification, and Master Prompt product development decisions through MASTER-0003.
Scope not yet read: no known recoverable source scope remains in the recorded audit baseline; future product work continues by vertical; production/deployed/device validation remains outside the environment.
Evidence roots: `docs/project-brain/`; `apps/backend/`; `apps/mobile/`; `.github/workflows/`; GitHub Actions runs on remediation/product commits.
Confidence level: HIGH for repository/source and completed CI evidence; MEDIUM for cross-module runtime semantics; BLOCKED for deployed/device state.
Open questions: production database/RLS/Storage/Auth configuration, real-device behavior, external provider quotas, and unrecoverable PB-001..PB-155 historical prose.

| Date | Decision | Reason | Evidence |
|---|---|---|---|
| 2026-09-11 | Treat the repository audit as evidence-first and resumable. | Project Brain must reflect what was actually read rather than inferred from filenames or stale docs. | `FILE_REVIEW_INDEX.md`; `READING_CHECKPOINTS.md` |
| 2026-09-11 | Keep `15_AUDIT_FINDINGS_APPENDIX.md` as the canonical issue register. | Avoid competing issue lists and preserve explicit finding lineage. | `15_AUDIT_FINDINGS_APPENDIX.md` |
| 2026-09-11 | Separate source-audit completion from remediation and product readiness. | A codebase can be fully audited without every finding being fixed, and fixed findings do not imply finished product journeys. | `FILE_REVIEW_INDEX.md`; `05_CURRENT_STATE.md` |
| 2026-09-12 | Consider Appendix remediation closed for PB-156..PB-257 after CI verification. | Backend and Mobile CI both completed successfully on the verified remediation tree, including Backend API E2E. | GitHub Actions runs `34685084158` and `34685084152` for remediation commit `46614b36040cb839d6062dae726dc74e51ab3b96` |
| 2026-09-12 | Preserve PB-230 as an evidence limitation rather than inventing PB-001..PB-155 history. | Exact historical prose is not recoverable from the exposed repository history. | `15_AUDIT_FINDINGS_APPENDIX.md` |
| 2026-09-12 | Treat production/device/external-provider checks as explicit environmental blockers. | They cannot be truthfully marked PASS from the current connector/runtime. | `REVIEW_GAPS.md`; `05_CURRENT_STATE.md` |
| 2026-09-12 | Do not reopen closed Appendix findings without new evidence. | Product roadmap gaps and previously-fixed defects are different work categories. | `REVIEW_GAPS.md`; `15_AUDIT_FINDINGS_APPENDIX.md` |
| 2026-09-12 | Start Master Prompt work with deterministic local Brain context before cloud AI integration. | Structured intent/entities can power many MYPA decisions without vendor lock-in or mandatory network cost. | `MASTER_PROMPT_PROGRESS.md`; `local-language-understanding.service.ts`; `planning.service.ts` |
| 2026-09-12 | Carry local planning entities into the Food Operating Loop through an explicit action adapter. | Brain understanding is only useful when it reaches a domain service through a testable orchestration boundary. | `local-meal-recommendation-action.adapter.ts`; `assistant.module.ts`; adapter spec |
| 2026-09-12 | Use the existing ingredient taxonomy as the first safety evidence layer. | The repository already contains canonical ingredient names, aliases and deterministic flags, so a small independent resolver avoids premature schema expansion. | `ingredient-taxonomy-supplement-v1.json`; `food-safety-taxonomy.service.ts` |
| 2026-09-12 | Fail closed for constrained meal recommendations when any ingredient's safety semantics are unknown. | Ignoring unknown safety data is unsafe; blocking preserves correctness until evidence is available. | `food-safety-taxonomy.service.ts`; `food-operating-loop.service.ts`; safety service spec |
| 2026-09-12 | Apply recipe safety filtering before recommendation scoring. | A forbidden recipe must be removed, not merely receive a lower score. | `food-operating-loop.service.ts`; `food-operating-loop.service.spec.ts` |
| 2026-09-12 | Keep taxonomy asset packaging explicit in backend build. | The safety resolver reads repository data outside `src`; production/runtime builds must carry that asset deterministically. | `copy-food-safety-taxonomy.mjs`; backend `package.json` |
| 2026-09-12 | Do not claim complete regulatory allergen coverage from the current taxonomy. | Existing flags are partial and ingredient-level; unknown or unmodeled semantics remain outside the verified contract. | `ingredient-taxonomy-supplement-v1.json`; `MASTER_PROMPT_PROGRESS.md` |
