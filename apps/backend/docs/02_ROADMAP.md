# Project Roadmap

## Completed

### Foundation
- NestJS + TypeScript backend
- Prisma + PostgreSQL foundation
- Configuration and environment validation
- Health endpoint

### Authentication
- Registration and login
- Argon2 password hashing
- JWT access/refresh token flow
- Session persistence and revocation
- Logout
- Protected routes
- Auth E2E coverage

### User Foundation
- User profile
- User settings and preferences
- Onboarding foundation
- Health and nutrition profiles

### Lifestyle Foundations
- Daily tracking
- Nutrition logs
- Food database foundation
- Meals and recipes foundations
- Workout foundation
- Supplements, reminders, calendar, notifications, habits foundations

### Intelligence Foundations
- Assistant module
- User intelligence
- Context engine
- Decision engine
- Adaptive learning
- Personal brain / memory integration
- Goal, budget, price, shopping and device intelligence foundations

### Engineering
- Backend CI workflow
- Date-aware daily tracking migration
- Backend dependency wiring fixes

---

## Current Phase — Vertical Slice

Build one complete user journey end-to-end instead of expanding isolated modules:

1. Authenticate
2. Complete onboarding/profile
3. Set nutrition goals
4. Log food/meal
5. Update daily calories/protein/water
6. Read a daily dashboard summary
7. Feed the resulting context into the Personal Assistant

The goal is a usable product slice that exercises the database, authentication, domain modules, and intelligence layer together.

---

## Next

### Phase 1 — Nutrition Vertical Slice
- Food search/filtering
- Meal creation from food items
- Nutrition totals from meal items
- Daily summary aggregation
- Goal comparison

### Phase 2 — Assistant Integration
- Authenticated assistant endpoint
- Context assembly from profile + nutrition + daily data
- Deterministic recommendations before AI calls
- Conversation memory integration

### Phase 3 — Frontend
- React Native + Expo app shell
- Authentication flow
- Onboarding
- Home/dashboard
- Nutrition logging
- Assistant chat

### Phase 4 — Expansion
- Workout tracking
- Pantry and shopping
- Habits
- Calendar/reminders
- Supplements
- Notifications

### Phase 5 — Hardening
- E2E coverage for critical flows
- Security audit
- Performance review
- Observability
- Production deployment
