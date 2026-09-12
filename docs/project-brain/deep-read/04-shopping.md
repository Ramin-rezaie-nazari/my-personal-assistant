# Shopping / Inventory / Price Intelligence Deep Read

Last updated: 2026-09-12
Review status: RECONCILED FOR RECORDED SCOPE; APPENDIX REMEDIATION VERIFIED
Scope actually read: complete recorded source-level scope for `shopping`, `inventory`, `shopping-intelligence`, and `price-intelligence`, including controllers, DTO/model contracts, persistence, analysis, scheduling, operational paths and direct specs/rechecks.
Scope not yet read: production price-source health/quotas, deployed runtime behavior and physical mobile execution.
Evidence roots: `apps/backend/src/modules/shopping/`; `inventory/`; `shopping-intelligence/`; `price-intelligence/`; `apps/backend/prisma/`; `docs/project-brain/FILE_REVIEW_INDEX.md`; canonical Appendix.
Confidence level: HIGH for recorded source-level audit and remediation evidence; MEDIUM for end-to-end behavior requiring deployment/external sources.
Open questions: live price-source health, provider availability, deployed data state and real-device shopping UX.

## Shopping base

Shopping access is user-scoped in the remediation baseline. FoodItem and Recipe lookups used by basket operations enforce the intended visibility/ownership rules, and recipe-missing writes are grouped transactionally. DTO ownership and contract boundaries were reconciled as part of PB-241 and related shopping findings.

## Inventory

Inventory is JWT/user-scoped and its DTOs use the local Inventory domain rather than importing request contracts from another module. Quantity validation and ownership boundaries are part of the reconciled source baseline.

## Shopping Intelligence

The source audit distinguished canonical deterministic household intelligence from stale placeholder/orphan artifacts. Active consumers and user-scoped planning paths are retained; legacy placeholder facades were retired or reclassified rather than presented as completed capabilities.

## Price Intelligence

Price routes have an authenticated controller boundary. Price history preserves the observation's actual source currency and chart bounds are derived from observed data rather than fabricated zero values. Currency is therefore not silently forced to a single locale at presentation time.

Price collection remains an external-integration surface. Source registry, HTTP adapters, scheduled collection and persistence exist in the repository, but real provider availability, quotas, remote response quality and production scheduling require deployed/runtime verification.

## Cross-domain contract risks

Quantity/unit/currency remain strategic architecture concerns across Recipe, Food, Inventory, Shopping, Budget and Price systems. The historical Appendix findings in this area were remediated where they represented concrete source defects, but the long-term Vision still calls for a stronger canonical unit/currency abstraction and multi-provider resilience before these systems can be considered globally complete.

## Verification

The canonical Appendix marks the shopping/inventory/price findings through the recorded PB set as remediated or explicitly reclassified. Backend CI passed the verified remediation tree, including migration/idempotence, build, unit tests and API E2E; Mobile CI passed typecheck, source/Jest tests, Expo validation and Android JS bundling.

## Boundary

Source-level closure is not the same as live market-data correctness, deployed scheduled-job reliability or final shopping UX. Those remain explicit product/operational validation work.
