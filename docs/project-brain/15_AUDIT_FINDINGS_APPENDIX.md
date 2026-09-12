# Audit Findings Appendix

Last updated: 2026-09-12
Review status: REMEDIATION RECONCILED; FINAL CI RECHECK IN PROGRESS

This file is the canonical current status of the findings catalog covered by the 2026-09-11 source audit. The original `OPEN` labels below represented the state at audit time. Where current source and CI evidence now disprove the original defect, the finding is marked `CLOSED — REMEDIATED`. Withdrawn/reclassified findings are preserved explicitly and are not counted as open work.

## Current status — PB-156 through PB-257

| Finding | Current status | Resolution / current evidence |
|---|---|---|
| PB-156 | CLOSED — REMEDIATED | LifeTasksModule is imported by AppModule and its runtime controller/service are active. |
| PB-157 | CLOSED — REMEDIATED | Legacy parallel LifeExecution source was retired from the active tree; LifeTasks is the canonical task domain. |
| PB-158 | CLOSED — REMEDIATED | LifeTasks DTOs now carry runtime validation metadata and bounded contracts. |
| PB-159 | CLOSED — REMEDIATED | Direct `LifeTasksService` spec added. |
| PB-160 | CLOSED — REMEDIATED | Metadata-only edits preserve an existing `completedAt`; status transitions set/clear it deterministically. |
| PB-161 | CLOSED — REMEDIATED | RecommendationIntelligence is runtime-mounted from the application module and no longer orphaned. |
| PB-162 | CLOSED — REMEDIATED | The stale empty recommendation controller contract was retired; active recommendation capabilities live in the canonical service path. |
| PB-163 | CLOSED — REMEDIATED | Current-state documentation was reconciled to the actual runtime architecture. |
| PB-164 | CLOSED — REMEDIATED | GoalIntelligenceModule is runtime-mounted. |
| PB-165 | CLOSED — REMEDIATED | Goal Intelligence providers were converted from disconnected placeholder architecture into the active service/test path. |
| PB-166 | CLOSED — REMEDIATED | Direct Goal Intelligence tests are present on the remediation branch. |
| PB-167 | NOT APPLICABLE | Retained as the previously recorded N/A audit item; not part of active remediation. |
| PB-168 | CLOSED — REMEDIATED | Dashboard date/range semantics now resolve from the user's persisted timezone. |
| PB-169 | CLOSED — REMEDIATED | Daily Command Center workout reads are bounded to the requested local-day range. |
| PB-170 | CLOSED — REMEDIATED | Device Intelligence controller has an authenticated boundary. |
| PB-171 | CLOSED — REMEDIATED | FitnessController now consumes `req.user.id`, matching the loaded-user JWT strategy contract. |
| PB-172 | CLOSED — REMEDIATED | Refresh rotation invalidates the previous refresh session. |
| PB-173 | CLOSED — REMEDIATED | Application security hardening includes auth rate-limiting and security headers in bootstrap. |
| PB-174 | CLOSED — REMEDIATED | Price History renders the snapshot's actual currency instead of forcing تومان. |
| PB-175 | CLOSED — REMEDIATED | Price History derives chart bounds from observed values and no longer fabricates zero. |
| PB-176 | CLOSED — REMEDIATED | Push registration is consumed from the mobile application lifecycle. |
| PB-177 | CLOSED — REMEDIATED | Notification runtime initialization is started from the mobile application lifecycle. |
| PB-178 | CLOSED — REMEDIATED | Notification action feedback is connected to the active mobile action flow/localization layer. |
| PB-179 | CLOSED — REMEDIATED | Mobile TypeScript validation includes committed test files. |
| PB-180 | CLOSED — REMEDIATED | Mobile voice/TTS dependency contract is declared and included in the workspace toolchain. |
| PB-181 | CLOSED — REMEDIATED | Voice/TTS is connected to an active application consumer path. |
| PB-182 | CLOSED — REMEDIATED | Mobile auth credentials use `expo-secure-store`, not AsyncStorage. |
| PB-183 | CLOSED — REMEDIATED | Duplicate animation wrapper artifacts were retired; `lib/motion.tsx` is the canonical source. |
| PB-184 | CLOSED — REMEDIATED | Command-center visual components use the shared locale/RTL layer. |
| PB-185 | CLOSED — REMEDIATED | TTS model preparation now pins revisions and verifies SHA-256 checksums. |
| PB-186 | CLOSED — REMEDIATED | `/brain-integration/context` is now exposed behind JWT and matches the mobile helper. |
| PB-187 | CLOSED — REMEDIATED | Persisted refresh-session expiry is derived from the configured refresh-token lifetime. |
| PB-188 | CLOSED — REMEDIATED | RecipeStep and RecipeMedia are now canonical Prisma models, matching the migration schema and operational scripts. |
| PB-189 | CLOSED — REMEDIATED | Destructive image reset requires an explicit confirmation token. |
| PB-190 | CLOSED — REMEDIATED | Country-intelligence cleanup is scoped to the same recipe working set when LIMIT mode is used. |
| PB-191 | CLOSED — REMEDIATED | Root `docs/05_CURRENT_STATE.md` is canonical and the backend copy is a compatibility pointer. |
| PB-192 | CLOSED — REMEDIATED | Recipe content import supports explicit restartable OFFSET/LIMIT batching. |
| PB-193 | CLOSED — REMEDIATED | Recipe content related writes execute within a transaction. |
| PB-194 | CLOSED — REMEDIATED | Image processing is aligned to the 100–150KB mobile-friendly target contract. |
| PB-195 | CLOSED — REMEDIATED | Legacy country-intelligence executable variants were retired from the active scripts surface; the final implementation is canonical. |
| PB-196 | CLOSED — REMEDIATED | Image quality reprocessing supports OFFSET/LIMIT over a paginated source set. |
| PB-197 | CLOSED — REMEDIATED | The active image pipeline is standardized on the canonical `hero` image/storage contract; conflicting executable variants were retired. |
| PB-198 | CLOSED — REMEDIATED | The final food-intelligence self-test is package-wired and executed in Backend CI. |
| PB-199 | CLOSED — REMEDIATED | Recommendation quality scoring now accepts the producer's fractional score and percentage representations without collapsing 0–1 values by another factor of 100. |
| PB-200 | CLOSED — REMEDIATED | Nutrition estimates carry deterministic source/provenance metadata. |
| PB-201 | CLOSED — REMEDIATED | Image RESET enumerates Storage objects through pagination before deleting the database state. |
| PB-202 | CLOSED — REMEDIATED | Existing recipe images and skipped attempts are paginated before missing-recipe detection. |
| PB-203 | CLOSED — REMEDIATED | The broken guaranteed-v8 entrypoint was retired; the active repository no longer references missing child executables. |
| PB-204 | CLOSED — REMEDIATED | Country preference scoring consumes the country/region fields it actually selects, and the obsolete classify-side helper was removed from that path. |
| PB-205 | CLOSED — REMEDIATED | Mobile domain clients now share the canonical authenticated transport with 401 refresh/retry behavior. |
| PB-206 | CLOSED — REMEDIATED | Recipe content workflow entrypoints now match package commands and active scripts. |
| PB-207 | CLOSED — REMEDIATED | Mobile onboarding completion synchronizes authenticated backend onboarding/profile state while preserving local state. |
| PB-208 | CLOSED — REMEDIATED | Refresh tokens are persisted as one-way hashes in `Session.refreshTokenHash`. |
| PB-209 | CLOSED — REMEDIATED | Refresh lookup enforces the persisted `expiresAt` invariant. |
| PB-210 | CLOSED — REMEDIATED | Retention policy is persisted per user and conversation history purges expired records on access/write. |
| PB-211 | CLOSED — REMEDIATED | Authenticated `DELETE /users/me` erases the application user graph and sessions transactionally. |
| PB-212 | CLOSED — REMEDIATED | E2E preparation now follows migration deployment rather than `prisma db push`. |
| PB-213 | CLOSED — REMEDIATED | The orphan duplicate UsersController source was retired. |
| PB-214 | CLOSED — REMEDIATED | A public health liveness contract is active and the stale competing health controller was retired/reconciled. |
| PB-215 | CLOSED — REMEDIATED | Daily Command Center uses persisted locale and RTL-aware presentation. |
| PB-216 | CLOSED — REMEDIATED | Audited secondary mobile routes use the shared i18n/RTL layer. |
| PB-217 | CLOSED — REMEDIATED | Meals hook order is stable across loading and loaded renders. |
| PB-218 | CLOSED — REMEDIATED | Command actions return locale-aware feedback through the active command-center localization layer. |
| PB-219 | CLOSED — REMEDIATED | Orphaned `lib/brand.ts` was retired; `lib/branding.ts` is canonical. |
| PB-220 | CLOSED — REMEDIATED | Recipe orphan checks now query missing-parent rows directly and fail on actual orphan counts. |
| PB-221 | CLOSED — REMEDIATED | Adaptive Learning day/window semantics use the user's persisted timezone. |
| PB-222 | CLOSED — REMEDIATED | The self-mutating one-time mobile typecheck workflow was removed. |
| PB-223 | CLOSED — REMEDIATED | Placeholder Adaptive Learning feedback/memory providers were removed from the active module graph. |
| PB-224 | CLOSED — REMEDIATED | The placeholder public Budget Intelligence root-plan contract was removed/reconciled; active user-scoped planning remains the supported path. |
| PB-225 | CLOSED — REMEDIATED | Placeholder FoodCostService was removed from the active Budget Intelligence provider graph. |
| PB-226 | CLOSED — REMEDIATED | Legacy Assistant Context/Reasoning/Recommendation providers were removed from the active module graph. |
| PB-227 | CLOSED — REMEDIATED | Stale DecisionEngineService/CreateDecisionDto artifacts were removed; the active decision path is canonical. |
| PB-228 | CLOSED — REMEDIATED | Personal Brain response planning reads persisted user language and selects localized fallback/style. |
| PB-229 | CLOSED — REMEDIATED | Legacy placeholder Assistant MemoryService was removed from the active module graph. |
| PB-230 | EVIDENCE-LIMITED — NOT ACTIONABLE CODE DEFECT | Exact PB-001..PB-155 historical prose cannot be recovered from the exposed repository history. No historical text was fabricated; the current catalog is now complete for PB-156..PB-257. |
| PB-231 | CLOSED — REMEDIATED | Yoga pose processing now rejects stale in-flight results after stop/session changes. |
| PB-232 | WITHDRAWN / RECLASSIFIED | Inline `Object` body metatype does not produce the claimed ValidationPipe whitelist collision. |
| PB-233 | CLOSED — REMEDIATED | Goals DTOs now have runtime validation decorators and bounded fields. |
| PB-234 | CLOSED — REMEDIATED | Calendar create DTO now carries runtime validation metadata. |
| PB-235 | CLOSED — REMEDIATED | Goal check-in child+parent writes are transactional. |
| PB-236 | CLOSED — REMEDIATED | Weekly habits use week-based streak semantics rather than a daily-consecutive algorithm. |
| PB-237 | WITHDRAWN / RECLASSIFIED | Inline `Object` body metatype does not produce the claimed ValidationPipe whitelist collision. |
| PB-238 | CLOSED — REMEDIATED | User Intelligence learning derives hour/weekday from the user's timezone when event metadata is missing. |
| PB-239 | CLOSED — REMEDIATED | Placeholder UserProfileService was removed from the active User Intelligence module graph. |
| PB-240 | CLOSED — REMEDIATED | Price Intelligence routes now have an authenticated controller boundary. |
| PB-241 | CLOSED — REMEDIATED | Recipe-missing basket writes are grouped in a transaction. |
| PB-242 | CLOSED — REMEDIATED | Frozen-lockfile installation now passes; dependency graph and lockfile are aligned. |
| PB-243 | RECONCILED / NOT UNIQUE | Merged into historical DTO-specific findings PB-077/PB-083/PB-085/PB-093. |
| PB-244 | CLOSED — REMEDIATED | Backend `.env.example` includes the required runtime variable placeholders. |
| PB-245 | CLOSED — REMEDIATED | Backend README now documents MYPA-specific environment, Prisma and operational setup. |
| PB-246 | CLOSED — REMEDIATED + CI VERIFIED | Mobile CI executes source tests and committed Jest specs in addition to typecheck/config/export validation. |
| PB-247 | CLOSED — REMEDIATED | Smart Planning uses persisted user timezone for local-day and scheduling semantics. |
| PB-248 | CLOSED — REMEDIATED | Empty Context Engine HTTP controller artifact was removed from module registration. |
| PB-249 | CLOSED — REMEDIATED | Generic NestJS root starter controller was retired from the active backend. |
| PB-250 | RECONCILED / NOT UNIQUE | Merged into PB-160. |
| PB-251 | WITHDRAWN | Missing-file claim was stale; current source contains the retry implementation. |
| PB-252 | CLOSED — REMEDIATED | Content Recommendation is no longer treated as an unresolved active runtime orphan. |
| PB-253 | WITHDRAWN | ConversationStyleService is actively consumed by ResponsePlanningService. |
| PB-254 | WITHDRAWN — FALSE POSITIVE | Current repository authentication is custom Prisma/JWT and no Supabase Auth identity binding or user-owned Supabase Storage deletion contract exists. Application DB/session erasure is implemented. |
| PB-255 | WITHDRAWN / MERGED | The missing v8 executable dependency issue is covered by PB-203; the broken v8 entrypoint itself was retired. |
| PB-256 | WITHDRAWN | Current-main/package source confirms the nutrition/recommendation scripts exist; PB-199/PB-200/PB-204 remain the independent quality findings and are now remediated. |
| PB-257 | CLOSED — REMEDIATED | `Workout(userId, performedAt)` and `UserBehavior(userId, createdAt)` composite indexes are present in the Prisma schema. |

## Historical catalog boundary

The exact prose of PB-001 through PB-155 is not recoverable from the repository history exposed to the remediation environment. `docs/project-brain/12_OPEN_WORK.md` preserves the historical ID/index information, but missing historical text is not reconstructed or invented. This is an evidence limitation, not a silently omitted finding.

## Verification boundary

Recent GitHub Actions evidence has verified the Mobile pipeline end-to-end and has verified Backend dependency installation, Prisma schema validation/generation, migration application/idempotence, and the food-intelligence self-test. The latest retention-service compatibility changes have triggered another Backend CI cycle; the branch must remain unmarked as production-green until that cycle completes successfully.

Local repository execution is unavailable because direct GitHub network access is blocked in the container environment. Production Supabase/Auth/Storage state, RLS configuration, push delivery and real-device UX remain outside the available runtime boundary.
