# Audit Findings Appendix

Last updated: 2026-09-12
Review status: CANONICAL FINDINGS REGISTER RECONCILED THROUGH PB-284; LATEST CODE CI VERIFIED; DOC RECONCILIATION CONTINUING

This file is the canonical findings register for the recoverable 2026-09-11 audit plus subsequent evidence-driven Master Prompt remediation. Historical PB-001..PB-155 prose is not recoverable from the exposed repository history and is never fabricated. Later IDs are current-branch findings and remediation records.

## Historical audit findings — PB-156..PB-257

| Finding | Status |
|---|---|
| PB-156 | CLOSED — LifeTasks runtime-mounted |
| PB-157 | CLOSED — legacy LifeExecution parallel source retired |
| PB-158 | CLOSED — LifeTasks DTO runtime validation/bounds |
| PB-159 | CLOSED — LifeTasks direct service test |
| PB-160 | CLOSED — completedAt/status semantics fixed |
| PB-161 | CLOSED — RecommendationIntelligence runtime-mounted |
| PB-162 | CLOSED — stale recommendation controller artifact retired |
| PB-163 | CLOSED — current-state documentation reconciled |
| PB-164 | CLOSED — GoalIntelligence runtime-mounted |
| PB-165 | CLOSED — Goal Intelligence wiring fixed |
| PB-166 | CLOSED — Goal Intelligence direct tests |
| PB-167 | NOT APPLICABLE |
| PB-168 | CLOSED — Dashboard timezone semantics |
| PB-169 | CLOSED — Command Center local-day workout bounds |
| PB-170 | CLOSED — Device Intelligence authenticated |
| PB-171 | CLOSED — Fitness request user identity |
| PB-172 | CLOSED — refresh rotation invalidation |
| PB-173 | CLOSED — auth rate limit/security headers |
| PB-174 | CLOSED — Price History currency rendering |
| PB-175 | CLOSED — Price History chart bounds no fabricated zero |
| PB-176 | CLOSED — push registration lifecycle |
| PB-177 | CLOSED — notification runtime init |
| PB-178 | CLOSED — notification action feedback |
| PB-179 | CLOSED — mobile test/typecheck scope |
| PB-180 | CLOSED — voice/TTS dependency contract |
| PB-181 | CLOSED — voice/TTS active consumer |
| PB-182 | CLOSED — SecureStore auth credential storage |
| PB-183 | CLOSED — duplicate motion artifact retired |
| PB-184 | CLOSED — command-center i18n/RTL |
| PB-185 | CLOSED — pinned/checksummed TTS model prep |
| PB-186 | CLOSED — brain-integration auth contract |
| PB-187 | CLOSED — refresh session expiry invariant |
| PB-188 | CLOSED — RecipeStep/RecipeMedia canonical models |
| PB-189 | CLOSED — image reset confirmation |
| PB-190 | CLOSED — country cleanup scope |
| PB-191 | CLOSED — canonical root current-state doc |
| PB-192 | CLOSED — restartable recipe content import |
| PB-193 | CLOSED — transactional recipe content writes |
| PB-194 | CLOSED — image size contract |
| PB-195 | CLOSED — legacy country script variants retired |
| PB-196 | CLOSED — paginated image quality reprocessing |
| PB-197 | CLOSED — canonical hero image pipeline |
| PB-198 | CLOSED — food intelligence self-test wired to CI |
| PB-199 | CLOSED — recommendation score representation |
| PB-200 | CLOSED — nutrition provenance |
| PB-201 | CLOSED — paginated storage image reset |
| PB-202 | CLOSED — paginated existing/skipped image checks |
| PB-203 | CLOSED — broken v8 entrypoint retired |
| PB-204 | CLOSED — country preference field/selector alignment |
| PB-205 | CLOSED — mobile authenticated transport dedup |
| PB-206 | CLOSED — recipe workflow entrypoints |
| PB-207 | CLOSED — onboarding backend synchronization |
| PB-208 | CLOSED — refresh token hashing |
| PB-209 | CLOSED — persisted refresh expiry enforcement |
| PB-210 | CLOSED — retention/conversation purge |
| PB-211 | CLOSED — authenticated account erasure |
| PB-212 | CLOSED — migration-first E2E preparation |
| PB-213 | CLOSED — orphan UsersController retired |
| PB-214 | CLOSED — health contract/controller reconciliation |
| PB-215 | CLOSED — Command Center locale/RTL |
| PB-216 | CLOSED — secondary mobile i18n/RTL |
| PB-217 | CLOSED — Meals hook-order stability |
| PB-218 | CLOSED — locale-aware command feedback |
| PB-219 | CLOSED — branding artifact cleanup |
| PB-220 | CLOSED — recipe orphan checks |
| PB-221 | CLOSED — Adaptive Learning timezone semantics |
| PB-222 | CLOSED — self-mutating mobile workflow removed |
| PB-223 | CLOSED — Adaptive Learning placeholders removed |
| PB-224 | CLOSED — placeholder Budget root-plan contract reconciled |
| PB-225 | CLOSED — placeholder FoodCostService removed |
| PB-226 | CLOSED — legacy Assistant providers removed |
| PB-227 | CLOSED — stale DecisionEngine artifacts removed |
| PB-228 | CLOSED — localized Brain response planning |
| PB-229 | CLOSED — legacy Assistant MemoryService removed |
| PB-230 | EVIDENCE-LIMITED — PB-001..PB-155 exact prose unavailable |
| PB-231 | CLOSED — stale Yoga in-flight results rejected |
| PB-232 | WITHDRAWN / RECLASSIFIED — claimed Object whitelist collision not reproduced |
| PB-233 | CLOSED — Goals DTO validation |
| PB-234 | CLOSED — Calendar create DTO validation |
| PB-235 | CLOSED — transactional Goal check-in |
| PB-236 | CLOSED — weekly habit streak semantics |
| PB-237 | WITHDRAWN / RECLASSIFIED — same Object metatype claim |
| PB-238 | CLOSED — User Intelligence timezone learning |
| PB-239 | CLOSED — placeholder UserProfileService removed |
| PB-240 | CLOSED — Price Intelligence JWT boundary |
| PB-241 | CLOSED — transactional recipe-missing shopping writes |
| PB-242 | CLOSED — frozen lockfile/dependency alignment |
| PB-243 | RECONCILED / NOT UNIQUE — merged into DTO-specific findings |
| PB-244 | CLOSED — `.env.example` runtime variables |
| PB-245 | CLOSED — backend README runtime/Prisma docs |
| PB-246 | CLOSED + CI VERIFIED — Mobile CI source/Jest coverage |
| PB-247 | CLOSED — Smart Planning timezone |
| PB-248 | CLOSED — empty Context Engine controller retired from module graph |
| PB-249 | CLOSED — generic root starter controller retired |
| PB-250 | RECONCILED / NOT UNIQUE — merged into PB-160 |
| PB-251 | WITHDRAWN — missing-file claim stale |
| PB-252 | CLOSED — Content Recommendation runtime orphan resolved |
| PB-253 | WITHDRAWN — ConversationStyleService has active consumer |
| PB-254 | WITHDRAWN — Supabase identity/storage premise is not the current architecture |
| PB-255 | WITHDRAWN / MERGED — covered by PB-203 |
| PB-256 | WITHDRAWN — nutrition/recommendation scripts exist in current source |
| PB-257 | CLOSED — Workout/UserBehavior composite indexes present |

## Master Prompt / continuation findings

| Finding | Status | Resolution |
|---|---|---|
| PB-258 | CLOSED — CI VERIFIED | Removed Shopping↔Inventory module cycle; Inventory owns household inventory intelligence. |
| PB-259 | CLOSED — CI VERIFIED | Authenticated Shopping Intelligence endpoint delegates to user-scoped ShoppingService. |
| PB-260 | CLOSED — CI VERIFIED | Shopping budget currency/remaining-budget/decision semantics hardened. |
| PB-261 | CLOSED — CI VERIFIED | PLAN_FOOD_BUDGET intent wired through Assistant/action path. |
| PB-262 | CLOSED — CI VERIFIED | Budget/Shopping authenticated HTTP E2E coverage added. |
| PB-263 | CLOSED — CI VERIFIED | Budget status distinguishes unfulfilled/over-budget evidence correctly. |
| PB-264 | CLOSED — CI VERIFIED | Recipe scaling → missing inventory → budget quote bridge implemented. |
| PB-265 | CLOSED — CI VERIFIED | Budget-qualified recipe gaps flow into canonical ShoppingService. |
| PB-266 | CLOSED — CI VERIFIED | Mobile Shopping/Price clients use canonical authenticated transport. |
| PB-267 | CLOSED — CI VERIFIED | Partial/insufficient budget evidence states are explicit and fail closed. |
| PB-268 | CLOSED — CI VERIFIED | Fresh compatible price evidence is selected over newer stale evidence. |
| PB-269 | CLOSED — CI VERIFIED | Deterministic next-action codes for blocked budget evidence added. |
| PB-270 | CLOSED — CI VERIFIED | ShoppingItem unit-compatible merge conversion/rejection implemented. |
| PB-271 | CLOSED — CI VERIFIED | Shopping completion synchronizes Inventory transactionally/idempotently. |
| PB-061 | CLOSED — CI VERIFIED | Market analysis uses durable PricePersistence history; process-local history store retired. |
| PB-064 | CLOSED — CI VERIFIED | Price source capability/trust metadata + runtime health telemetry added. |
| PB-065 | CLOSED — CI VERIFIED | Product matching accounts for package quantity/unit compatibility. |
| PB-059 | CLOSED — CI VERIFIED | Price analysis rejects incompatible currency evidence and prefers unitPrice. |
| PB-272 | CLOSED — CI VERIFIED | Unused Price History/Analysis placeholder providers retired. |
| PB-273 | CLOSED — CI VERIFIED | Public Price analysis delegates to canonical MarketAnalysisService. |
| PB-274 | CLOSED — CI VERIFIED | Unused ShoppingList/PurchaseAnalysis placeholder facades retired. |
| PB-275 | CLOSED — CI VERIFIED | PurchasePlan rejects item currency mismatches with `currency_mismatch`. |
| PB-276 | CLOSED — CI VERIFIED | Invalid Shopping basket quantity returns Bad Request semantics. |
| PB-277 | CLOSED — CI VERIFIED | Shopping basket/from-recipe bodies use runtime-validated DTO classes. |
| PB-278 | CLOSED — CI VERIFIED | Recipe→Shopping requests reject non-recipe/invalid items instead of silently dropping. |
| PB-279 | CLOSED — CI VERIFIED | DTO test loads `reflect-metadata` before decorator-dependent modules; isolated Jest bootstrap fixed. |
| PB-280 | CLOSED — CI VERIFIED | Budget meal-plan servings validated as integer 1..10000 before service invocation. |
| PB-281 | CLOSED — CI VERIFIED | Unused `createMealBudgetPlan()` placeholder removed. |
| PB-282 | CLOSED — CI VERIFIED | FoodOperatingLoop invalid target servings now return Bad Request, with direct tests. |
| PB-283 | CLOSED — CI VERIFIED | Unbounded Budget quote reports actual priced spend; `budgetRemaining` is null without a limit. |
| PB-284 | OPEN — DOCUMENTATION CONSISTENCY | `docs/project-brain/05_API_CATALOG.md` still contains stale `No guard`/route rows for active Budget, Shopping Intelligence and Price Intelligence controllers. Current source has JWT guards and current route wiring. This must be reconciled without losing the historical route inventory. |

## Historical boundary and environment limits

PB-001..PB-155 exact historical prose is not recoverable from exposed Git history; no historical text is fabricated. This is an evidence boundary, not a hidden code defect.

Production/deployed PostgreSQL schema/RLS/Storage/Auth configuration, real Android/iOS execution, physical-device UX/offline/voice/notification delivery, production scheduler behavior, and external price/AI provider quotas/availability remain outside the available connector/runtime. They are BLOCKED/UNVERIFIED, not silently marked PASS.

## Verification evidence

Latest implementation code head verified by CI: `56d29953e83ead705eb57b39e7681b1793e97bcd`.
- Backend CI `34693061066`: SUCCESS — Prisma validation/generation, migrations/idempotence, food self-test, build, backend unit tests, API E2E and diagnostics.
- Mobile CI `34693061017`: SUCCESS — dependency install, TypeScript, source tests, committed Jest specs, Expo validation and Android JavaScript bundle.

Later commits are documentation-only reconciliation commits and do not change runtime code. Validation PR #70 remains open, mergeable, unmerged, and validation-only.
