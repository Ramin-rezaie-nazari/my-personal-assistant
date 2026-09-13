# MYPA Project Brain — Overview

Last updated: 2026-09-13
Review status: IN_PROGRESS — REMEDIATION RECONCILED; CI RECHECK IN PROGRESS; SPORTS CATALOG TARGET RECONCILIATION OPEN
Scope actually read: repository navigator; current-state/roadmap/validation/history docs; root and workspace package manifests; backend auth/session; Core Project Brain; Prisma schema + migrations; Food/Recipe/Nutrition/Meals/Recommendation/Budget; Shopping/Inventory/Price Intelligence; Life/Health; Fitness/Workout/Calisthenics/Gym/Yoga; selected Personal Brain consumers; Platform/Test/CI; substantial Mobile route/client/component/native scope; sports catalog summary/manifests and fitness ingestion/audit scripts.
Scope not yet read: exhaustive remaining Mobile route/component/library inventory; exhaustive repository-wide route/reader-writer/transaction matrix; complete Fitness runtime corpus/media validation on the user's Mac; physical-device behavior; deployed infrastructure state; complete production security/privacy closure; historical PB-001..PB-155 prose.
Evidence roots: MYPA_START_HERE.md; AGENTS.md; docs/project-brain/; apps/backend/src/modules/; apps/backend/prisma/; apps/backend/scripts/; apps/mobile/; data/mypa-sports-catalog-expanded/; .github/workflows/.
Confidence level: HIGH for inspected source contracts and committed audit evidence; MEDIUM for runtime/device/deployed-state claims that require the user's Mac, real services, or production infrastructure.
Open questions: final CI green after refresh-token rotation coverage; exact intended sports-catalog total versus the committed 919 summary total; complete local media population/audit; native/device validation; deployed schema/storage/runtime state.

## Product

My Personal Assistant is a lifestyle operating system centered on a specialized Personal Brain. It spans authentication, profiles, nutrition/food/recipes, shopping/inventory, fitness disciplines, habits, reminders/calendar, supplements, notifications, conversational assistant behavior, and device-aware capabilities.

## Architecture intent

The documented architecture separates mobile UX/device concerns from backend domain state and decision logic. The Personal Brain consumes structured summaries, makes explainable decisions, routes to domain engines/actions, and learns from outcomes. External AI is intended as an optional accelerator rather than the only source of intelligence.

## Current evidence-backed state

The repository has a modular NestJS/TypeScript backend with Prisma/PostgreSQL, JWT auth and Argon2 password hashing. Mobile uses Expo/React Native. Auth refresh tokens now carry a random `jti`, and committed tests explicitly verify rotation/replay rejection. The committed sports catalog summaries currently reconcile to 871 strength/bodyweight records plus 48 Yoga records = 919 normalized records; a dedicated CI gate now checks that arithmetic so the catalog cannot silently drift. Runtime corpus/media population on the user's Mac, native/device validation, deployed infrastructure validation, and store readiness remain release gates.

## Audit rule

This document is not complete while any claim depends only on historical documentation. Later batches must replace or qualify claims with source/test evidence, and every newly discovered defect or contract gap must be recorded in `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md`.
