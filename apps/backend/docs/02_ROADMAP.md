# Project Roadmap

> The operational source of truth for exact progress, test checkpoints and current blockers is **[05_CURRENT_STATE.md](./05_CURRENT_STATE.md)**. This roadmap stays intentionally high-level.

## Completed foundations

### Platform
- NestJS + TypeScript backend
- Prisma + PostgreSQL foundation
- Configuration/environment validation
- Health endpoint
- Monorepo/workspace structure
- Backend and mobile CI workflow foundations

### Authentication and user foundation
- Registration/login
- Argon2 password hashing
- JWT access/refresh flow
- Session persistence/revocation
- Logout
- Protected routes
- User profile
- User settings/preferences
- Onboarding foundation
- Health/nutrition profiles

### Lifestyle foundations
- Daily tracking
- Nutrition logs and summaries
- Food database foundation
- Meals and recipes foundation
- Recipe serving persistence and scaling engine
- Workout foundation
- Supplements
- Reminders
- Calendar
- Notifications
- Habits
- Goals
- Inventory/shopping foundations
- Price intelligence foundation

### Intelligence foundations
- Assistant module
- Local language understanding
- Deterministic local action adapters
- Context engine
- Decision engine
- Personal Brain / memory integration
- Decision audit/outcome foundations
- Adaptive learning foundations
- Goal, budget, price, shopping and device intelligence foundations
- Proactive coach / notification intelligence foundations
- Planning/replanning/execution-state foundations

### Fitness foundations
- Shared Fitness context
- Gym
- Calisthenics and progression/skill foundations
- Yoga and coaching/motion-analysis foundations
- Equipment-aware generation
- Fitness performance/progression memory

## Validated checkpoint — 2026-08-18

- Backend Jest: **147/147 suites, 390/390 tests — PASS**
- Backend E2E: **4/4 suites, 24/24 tests — PASS**
- Recipe Scaling focused tests: **2/2 suites, 6/6 tests — PASS**
- Prisma: **36 migrations applied; schema up to date**
- Recipe scaled endpoint is registered in E2E boot

Typecheck/build must be re-run on this exact checkpoint before it is labeled fully green. See `05_CURRENT_STATE.md`.

---

# Current Phase — Product Integration and Global Food Intelligence

The project has moved beyond isolated backend foundations. The next goal is to turn the validated domain engines into one coherent consumer product.

## Phase A — Recipe/Food Intelligence

### Done
- Provider-agnostic Recipe Intelligence contracts
- Deterministic serving scaling
- Nutrition per batch/per serving
- Scaling policies for non-linear ingredients
- Recipe scaling API

### In progress
- 195-country food intelligence integration
- Canonical ingredient taxonomy
- Region/cuisine model
- Recipe provenance/versioning
- High-quality recipe corpus

### Remaining
- Verified recipe dataset at scale
- Dietary/allergen/substitution coverage
- Inventory matching
- Shopping-list generation
- Local price/budget matching
- Meal planning integration
- Feedback/learning loop

## Phase B — Personal Brain product integration

### Remaining major slices
- Complete authenticated vertical journeys across profile → nutrition → assistant → actions
- Broader deterministic natural-language action coverage
- Stronger Brain ↔ Recipe/Inventory/Shopping integration
- User-visible explanation UX
- Proactive coach UX
- Outcome feedback UX

## Phase C — Mobile product

### Current
- Expo/mobile application shell exists
- Local language state and assistant entry path exist

### Remaining
- Production-grade auth UX
- Onboarding
- Home/dashboard
- Nutrition logging
- Recipe discovery/cooking
- Serving selector UI
- Pantry/inventory
- Shopping
- Fitness/Yoga/Calisthenics/Gym
- Habits/reminders/calendar/supplements
- Brain chat/coach
- Global settings UX
- Accessibility
- Offline/local-first behaviors where useful
- iOS/Android physical-device validation
- Store release hardening

## Phase D — Global market and price intelligence

A 195-country market/currency workstream exists on a separate branch/PR and must be integrated only after dependency and validation review.

## Phase E — Production hardening

- Security/authorization audit
- Rate limiting/abuse controls
- Observability
- Performance/load review
- Background job reliability
- Notification reliability
- Backup/restore and disaster recovery
- Privacy/data-retention review
- Migration discipline
- Production deployment runbook
- Cost controls and external API fallback policy

## Phase F — Business and monetization

- Product packaging
- Free/paid boundaries
- Subscription/billing
- Pricing experiments
- Store monetization
- Growth/retention analytics
- Referral/viral loops
- Revenue dashboards
- Legal/compliance/product policies

## Rule

Do not declare the whole project 100% because the backend is green. A slice is complete only when implementation, data/modeling, tests, integration, UX, documentation and required environment validation are complete for its intended production scope.
