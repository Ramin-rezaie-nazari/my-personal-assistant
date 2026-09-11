# File Review Index

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-main baseline/Core; complete Prisma schema + all 39 migration SQL files; complete Assistant TypeScript source/test scope; complete enumerated Brain file-level scope; complete Food/Recipe/Nutrition/Meals/Recommendation/Budget file-level scope; relevant recipe nutrition script; complete enumerated Shopping/Inventory/Shopping Intelligence and substantial Price Intelligence; complete enumerated Life/Health; complete enumerated Fitness/Workout/Calisthenics/Gym/Yoga and related Personal Brain consumers; Platform/Test/CI enumerated manifests/E2E/workflows; substantial Mobile routes/clients/components; remaining identified Mobile library contracts/scripts; BATCH-0012 backend controller inventory and selected mobile consumer reconciliation; initial BATCH-0013 operational recipe scripts; BATCH-0018 active DTO validation sweep, Project Brain inventory and CI run evidence; BATCH-0022 CI/package/workflow runtime-evidence continuation; BATCH-0023 Content + Conversation Engine module/service consumer reconciliation; historical Git-history lookup for the Audit Findings Appendix path.
Scope not yet read: exhaustive backend operational scripts; any Mobile source outside current audited trees if present; exhaustive platform/common/test inventory; repository-wide route/consumer/DB transaction map; runtime validation; full security/privacy; complete route↔DTO↔test↔mobile mapping; complete DB reader/writer/relation/index matrix; canonical Appendix final merge/freeze.
Evidence roots: target `main` commit `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`; audit branch `audit/project-brain-2026-09-11`; `apps/backend/src/modules/`; `apps/backend/prisma/`; `apps/backend/scripts/`; `apps/mobile/`; `.github/workflows/`; `docs/project-brain/`.
Confidence level: HIGH for closed file-read scopes; MEDIUM for cross-module semantics; LOW for whole-repository completion.
Open questions: exact repo-wide source/line inventory; native/generated-media boundaries; live DB drift; route/mobile/database consumers; runtime tests/build/device validation; script canonicality/deprecation policy; deployed RLS/edge controls; complete retention/deletion coverage for every persisted user-sensitive table.

## Closed / explicitly read batches

| Batch | Scope | Status | Notes |
|---|---|---|---|
| BATCH-0001 | Baseline/Auth/manifests | READ_COMPLETELY | Audit branch initialized |
| BATCH-0002 | Core | READ_COMPLETELY | Auth/Users/Profile/Preferences/Onboarding/Settings/Context/Device/User Intelligence |
| BATCH-0003 | Prisma/migrations | READ_COMPLETELY | `schema.prisma` + all 39 migration SQL + lock |
| BATCH-0004 | Brain | READ_COMPLETELY | Assistant + Personal Brain + Brain Integration + Conversation + Decision + Adaptive + Goal + Memory |
| BATCH-0005 | Food/Recipe/Nutrition/Meals/Recommendation/Budget + Shopping/Inventory/Price | READ_COMPLETELY | Enumerated source scope; runtime/schema consumer reconciliation pending |
| BATCH-0006 | Life/Health | READ_COMPLETELY | Enumerated Calendar/Daily/Goals/Habits/LifeExecution/LifeTasks/Reminders/Notifications/Supplements/Health |
| BATCH-0007 | Fitness | READ_COMPLETELY | Enumerated Fitness/Workout/Calisthenics/Gym/Yoga + Brain fitness consumers |
| BATCH-0008 | Platform/Tests/CI | READ_COMPLETELY | Enumerated manifests/E2E/workflows; no runtime execution claim |
| BATCH-0009 | Mobile main route/client/native scope | READ_COMPLETELY | Enumerated high-use routes/clients/specs/config |
| BATCH-0010 | Mobile components/motion/scripts | READ_COMPLETELY | All 7 components, `lib/motion.tsx`, 2 scripts read; findings PB-183..185 |
| BATCH-0011 | Mobile residual library contract scope | READ_COMPLETELY | `design-system.ts`, `motion-components.tsx`, `branding.ts`, `branding.spec.ts`, notification contract/spec read; active consumers checked where relevant |
| BATCH-0012 | Backend route/API/controller inventory + selected consumers | IN_PROGRESS | Controller/path/guard inventory largely read; DTO/test/mobile consumer reconciliation remains open. PB-186/PB-187 added. |
| BATCH-0013 | Backend operational scripts | IN_PROGRESS | Began with recipe content/image/country scripts and expanded through image/restartability/release workflow surfaces; PB-188..PB-220 across continuation. |
| BATCH-0014 | Mobile library + backend startup/config continuation | IN_PROGRESS | Domain clients, startup/config, branding, operational script continuation; PB-218..PB-220. |
| BATCH-0015 | CI/workflow + Adaptive Learning continuation | IN_PROGRESS | CI workflows, package manifests, Adaptive Learning services; PB-221..PB-223. |
| BATCH-0016 | Backend validation/Goals/Calendar/Memory continuation | IN_PROGRESS | ValidationPipe, active write DTOs, Goals/Calendar/Memory, Yoga/notifications; PB-231..PB-235. |
| BATCH-0017 | Shopping transaction continuation | IN_PROGRESS | Shopping `addRecipeMissing()` and Recipe Food Operating Loop consumer; PB-241. |
| BATCH-0018 | Validation sweep + CI evidence + Project Brain inventory | IN_PROGRESS | Active Habits/Workout/Supplements/LifeExecution DTO/controller surfaces; current Open Work/Appendix/Project Brain inventories; Recipe image CI failed run evidence; PB-242 plus provisional PB-243 pending duplicate reconciliation. |
| BATCH-0022 | CI/workflow/package/runtime evidence | IN_PROGRESS | Current package/workflow cross-check; real Actions failure evidence; PB-206/PB-242 reconfirmed without duplicate. |
| BATCH-0023 | Content + Conversation Engine consumer reconciliation | IN_PROGRESS | `ContentModule`/`ContentRecommendationService`; `ConversationEngineModule`/`ConversationStyleService`; AppModule/PersonalBrainModule graph; PB-252/PB-253 provisional. |

## Database

| Scope | Status | Notes |
|---|---|---|
| `apps/backend/prisma/schema.prisma` | READ_COMPLETELY | 32 final Prisma models |
| `apps/backend/prisma/migrations/` | READ_COMPLETELY | All 39 migration SQL files |
| `migration_lock.toml` | READ_COMPLETELY / identified | Provider lock recorded |

Known runtime migration/schema anomalies remain open. Repository-wide exact source line counts are not claimed because no local clone/runtime filesystem is available in this session.

## Historical recovery

The repository's exposed Git history for `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` was checked directly. The audit-branch path begins with PB-156-era Appendix commits; the default/main branch has no history for the audit-only Appendix path. Exact PB-001..PB-155 prose is therefore not recoverable from the repository history available to this audit and is documented as an evidence limitation rather than reconstructed.

## Important caveat

`READ_COMPLETELY` means every file explicitly enumerated for the closed batch was actually read. It does not mean the whole repository has been read. Any file not in a closed batch remains unreviewed unless separately recorded elsewhere.
