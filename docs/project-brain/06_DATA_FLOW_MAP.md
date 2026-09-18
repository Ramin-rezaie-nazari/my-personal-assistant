# Data Flow Map

Last updated: 2026-09-18
Review status: CURRENT DATA-FLOW RECONCILED / DEVICE VERIFICATION PENDING
Scope actually read: current-`main` Core data flows.
Historical Core-only scope notes are retained as the original audit snapshot. Current flow boundaries are documented across the Project Brain deep-reads and implementation, with runtime/device evidence kept separate.
Evidence roots: Core services/controllers.
Confidence level: HIGH for the principal current backend/mobile/database data-flow boundaries.
Open questions: physical device lifecycle and production deployment/observability.

## Auth

Register/login -> AuthController -> AuthService -> UsersService lookup/create -> Argon2 -> token utilities -> SessionService -> Prisma session -> response. Evidence: `apps/backend/src/modules/auth/auth.service.ts:21-112`; `apps/backend/src/modules/auth/services/session.service.ts:8-45`.

Refresh -> verify refresh JWT -> require `type === 'refresh'` -> session lookup -> user lookup -> new access/refresh pair -> new session. Evidence: `apps/backend/src/modules/auth/auth.service.ts:63-89`.

## User settings/profile

JWT request -> guarded controller -> Prisma-backed service -> read or upsert. Evidence: `apps/backend/src/modules/profile/services/profile.service.ts:1-33`; `apps/backend/src/modules/preferences/services/preferences.service.ts:1-48`; `apps/backend/src/modules/settings/services/settings.service.ts:1-34`.

## Context

Caller -> `ContextEngineService.buildContext` -> `LifeContextFusionService.build` -> normalized ten-domain LifeContext. Priority resolution is a separate deterministic step using freshness and confidence. Evidence: `apps/backend/src/modules/context-engine/services/context-engine.service.ts:1-20`; `apps/backend/src/modules/context-engine/services/life-context-fusion.service.ts:1-72`; `apps/backend/src/modules/context-engine/services/context-priority-resolver.service.ts:1-57`.

## User intelligence

JWT controller -> LearningService records a UserBehavior event -> buildProfile reads latest 1000 events -> deterministic aggregates -> UserIntelligenceService may create UserInsight records. Evidence: `apps/backend/src/modules/user-intelligence/controllers/user-intelligence.controller.ts:1-38`; `apps/backend/src/modules/user-intelligence/services/learning.service.ts:15-120`; `apps/backend/src/modules/user-intelligence/services/user-intelligence.service.ts:1-46`.
