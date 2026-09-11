# MYPA Project Brain — Overview

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: repository navigator, current-state/roadmap/validation/history docs, root package manifest, mobile package manifest, initial backend auth/session implementation.
Scope not yet read: complete backend/mobile source and runtime validation.
Evidence roots: MYPA_START_HERE.md; AGENTS.md; apps/backend/docs/05_CURRENT_STATE.md; apps/backend/docs/03_PROJECT_BRAIN_BOOK.md; apps/backend/docs/04_ARCHITECTURE_ATLAS.md; apps/backend/docs/06_VALIDATION_LEDGER.md; apps/backend/docs/08_AUTONOMOUS_PROGRESS_LOG.md; package.json; apps/mobile/package.json; apps/backend/src/modules/auth/.
Confidence level: MEDIUM.
Open questions: full source inventory and all cross-domain integration details.

## Product

My Personal Assistant is a lifestyle operating system centered on a specialized Personal Brain. It spans authentication, profiles, nutrition/food/recipes, shopping/inventory, fitness disciplines, habits, reminders/calendar, supplements, notifications, conversational assistant behavior, and device-aware capabilities.

## Architecture intent

The documented architecture separates mobile UX/device concerns from backend domain state and decision logic. The Personal Brain consumes structured summaries, makes explainable decisions, routes to domain engines/actions, and learns from outcomes. External AI is intended as an optional accelerator rather than the only source of intelligence.

## Current evidence-backed state

The repository has a modular NestJS/TypeScript backend with Prisma/PostgreSQL, JWT auth and Argon2 password hashing. Mobile uses Expo/React Native. Current-state documentation reports strong backend foundations but explicitly keeps several release gates pending, including runtime corpus/media population, native device validation, Yoga live pose integration, and store readiness.

## Audit rule

This document is not complete while any claim depends only on historical documentation. Later batches must replace or qualify claims with source/test evidence.
