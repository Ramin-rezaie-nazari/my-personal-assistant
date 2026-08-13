# My Personal Assistant — Architecture Atlas

> **Status:** Living architecture map for the whole repository.
>
> **Purpose:** Make the project understandable from the folder/file tree alone: what each area owns, why it exists, what it consumes, what it produces, and how the pieces connect.
>
> **Companion documents:**
> - `00_PROJECT_OVERVIEW.md` — concise product overview.
> - `01_ARCHITECTURE.md` — original architecture foundation.
> - `02_ROADMAP.md` — original roadmap.
> - `03_PROJECT_BRAIN_BOOK.md` — long-form engineering history and Brain design.
> - **This file** — the architecture/tree atlas and relationship map.
>
> **Important:** Git is the source of truth for the exact live file tree. This document is the semantic source of truth for the *meaning* of the tree and the relationships between major files/folders. When a major architectural boundary, domain, database model, memory layer, or integration changes, update both this atlas and the Brain Book.

---

# 1. Executive picture

The project is a local-first, privacy-aware lifestyle operating system with a specialized Personal Brain.

```text
                           ┌───────────────────────┐
                           │      Mobile App       │
                           │ Dashboard / Coach     │
                           │ Fitness / Yoga        │
                           │ Camera / Voice / UX   │
                           └───────────┬───────────┘
                                       │ JWT API
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                               BACKEND                                    │
│                                                                         │
│  Auth/User Foundation                                                   │
│      ↓                                                                  │
│  Context + Memory + User Intelligence                                   │
│      ↓                                                                  │
│  Personal Brain                                                        │
│      ├── reasoning                                                     │
│      ├── decision policy                                               │
│      ├── explanation                                                   │
│      ├── long-term decision memory                                    │
│      ├── outcome learning                                              │
│      ├── planning / scheduling                                         │
│      ├── proactive coach / notifications                              │
│      └── safe action execution                                         │
│      ↓                                                                  │
│  Domain engines                                                         │
│      ├── Nutrition / Meals / Recipes / Budget / Price                  │
│      ├── Fitness / Yoga / Calisthenics / Gym / Workout                 │
│      ├── Habits / Reminders / Calendar / Daily                         │
│      └── Device / Adaptive learning / Assistant / Conversation        │
│      ↓                                                                  │
│  PostgreSQL                                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

The key architectural idea is a closed loop:

```text
USER STATE
   ↓
CONTEXT
   ↓
REASONING
   ↓
DECISION
   ↓
EXPLANATION
   ↓
ACTION / COACHING
   ↓
OUTCOME
   ↓
LEARNING
   ↓
BETTER FUTURE DECISION
```

The UI is deliberately not the brain. The UI displays decisions and state from the backend; the domain engines own their rules; the Personal Brain coordinates cross-domain decisions.

---

# 2. Repository tree — the meaningful shape

```text
/
├── .github/
│   └── workflows/
│       ├── backend validation workflow(s)
│       └── mobile validation workflow(s)
│
├── apps/
│   ├── backend/
│   │   ├── docs/
│   │   │   ├── 00_PROJECT_OVERVIEW.md
│   │   │   ├── 01_ARCHITECTURE.md
│   │   │   ├── 02_ROADMAP.md
│   │   │   ├── 03_PROJECT_BRAIN_BOOK.md
│   │   │   └── 04_ARCHITECTURE_ATLAS.md
│   │   │
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   │       ├── domain and date-tracking migrations
│   │   │       ├── fitness-profile persistence
│   │   │       ├── decision outcome history
│   │   │       └── outcome-source separation
│   │   │
│   │   └── src/
│   │       ├── common/
│   │       │   ├── config/
│   │       │   └── database/
│   │       │       └── prisma service/module
│   │       │
│   │       └── modules/
│   │           ├── auth/
│   │           ├── users/
│   │           ├── assistant/
│   │           ├── personal-brain/
│   │           ├── brain-integration/
│   │           ├── context-engine/
│   │           ├── memory-intelligence/
│   │           ├── user-intelligence/
│   │           ├── adaptive-learning/
│   │           ├── decision-engine/
│   │           ├── device-intelligence/
│   │           ├── budget-intelligence/
│   │           ├── price-intelligence/
│   │           ├── calendar/
│   │           ├── daily/
│   │           ├── daily-command-center/
│   │           ├── dashboard/
│   │           ├── conversation-engine/
│   │           ├── nutrition / food / meal / recipe domain(s)
│   │           ├── workout/
│   │           ├── fitness/
│   │           ├── yoga/
│   │           ├── calisthenics/
│   │           ├── gym/
│   │           ├── habits/
│   │           ├── reminders/
│   │           ├── supplements/
│   │           ├── notifications/
│   │           └── additional supporting domain/infrastructure modules
│   │
│   └── mobile/
│       └── React Native / Expo mobile application area
│
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── repository/tooling files
```

## 2.1 Why the tree is split this way

- `apps/backend` owns authoritative domain state, business rules, persistence, decisions, execution, and APIs.
- `apps/mobile` owns user interaction, visualization, device capabilities, and local UX orchestration.
- `docs` preserves intent and architecture so implementation does not drift away from the original product design.
- `prisma` defines durable state and migration history.
- `modules` isolates business domains so one area can evolve without turning the backend into one giant service.

---

# 3. Backend foundation

## 3.1 `apps/backend/src/common/`

This is infrastructure shared by many domains.

### `common/config/`

Owns validated environment/configuration values. Secrets and environment-specific values belong here rather than in feature modules or mobile code.

### `common/database/`

Owns Prisma module/service wiring and database access infrastructure.

Relationship:

```text
Domain service
   ↓
PrismaService
   ↓
PostgreSQL
```

Feature modules should depend on the database abstraction, not on random direct connection code.

---

# 4. Authentication and user identity

## 4.1 `auth/`

Current verified responsibility:

```text
auth/
├── auth.service.ts
├── controllers/
│   └── auth.controller.ts
├── strategies/
│   └── jwt.strategy.ts
├── services/
│   └── session.service.ts
└── auth.module.ts
```

The module imports `UsersModule`, configuration, Passport, and JWT infrastructure. It exports `AuthService` and protects routes with JWT.

Responsibilities:

- registration/login
- password hashing via Argon2
- JWT access/refresh flow
- current-user identity
- session persistence/revocation
- route protection

The Personal Brain and all user-sensitive domain controllers assume a validated authenticated user identity.

## 4.2 `users/`

Owns user CRUD/profile-facing identity state and exposes `UsersService` to modules such as authentication.

Relationship:

```text
auth → users → PostgreSQL/User
             ↓
        all user-scoped domains
```

---

# 5. Assistant vs Personal Brain

The repository contains both an `assistant/` domain and a `personal-brain/` domain.

## 5.1 `assistant/`

The verified module owns conversation-facing intelligence helpers such as:

```text
AssistantService
MemoryService
ContextService
ReasoningService
RecommendationService
PlanningService
RuleEngineService
KnowledgeService
NaturalActionExecutionService
ConversationHistoryService
ConversationContextService
ContextualCommandService
```

It imports `PersonalBrainModule` and `PrismaModule`.

Role:

- conversational/product-level assistant entry point
- natural commands
- conversation context/history
- rule/knowledge/recommendation helpers
- bridge from user language to Brain/domain capabilities

## 5.2 `personal-brain/`

This is the deeper cross-domain decision system.

The Assistant should not duplicate the Brain. Instead:

```text
Assistant
   ↓
Personal Brain
   ↓
Domain engines / execution
```

This separation prevents chat UX from becoming the source of truth for business logic.

---

# 6. The Personal Brain module — the architectural center

Verified current module dependencies include:

```text
personal-brain
 ├── conversation-engine
 ├── daily
 ├── workout
 ├── habits
 ├── supplements
 ├── brain-integration
 ├── context-engine
 ├── memory-intelligence
 ├── user-intelligence
 ├── reminders
 ├── calendar
 ├── fitness
 ├── yoga
 ├── calisthenics
 └── gym
```

This dependency list is intentional: the Brain is allowed to consume summarized state from many domains, while domains remain responsible for their specialized rules.

## 6.1 Controller

`personal-brain/controllers/personal-brain.controller.ts`

Current endpoint families include:

```text
GET  /personal-brain
GET  /personal-brain/plan
GET  /personal-brain/plan/history
GET  /personal-brain/trace
GET  /personal-brain/explanations/history
GET  /personal-brain/explanations/trend
POST /personal-brain/decision/explain
POST /personal-brain/decision/outcome
GET  /personal-brain/decision/outcome-profile
POST /personal-brain/fitness/session
POST /personal-brain/fitness/performance
GET  /personal-brain/fitness/performance
GET  /personal-brain/fitness/skills
GET  /personal-brain/schedule/today
GET  /personal-brain/schedule/replan
GET  /personal-brain/schedule/insights
GET  /personal-brain/schedule/health
GET  /personal-brain/schedule/replan-decision
GET  /personal-brain/schedule/recovery
GET  /personal-brain/next-action
GET  /personal-brain/coach/next
GET  /personal-brain/coach/message
GET  /personal-brain/coach/events
POST /personal-brain/coach/notification-decision
POST /personal-brain/coach/notification-feedback
POST /personal-brain/coach/device
GET  /personal-brain/coach/devices
POST /personal-brain/coach/cue
POST /personal-brain/scenario/compare
POST /personal-brain
```

All user-sensitive routes use JWT protection and take user identity from the authenticated request rather than trusting a user id supplied by the client.

## 6.2 `personal-brain.module.ts`

The module currently wires the major Brain services, including:

### Brain/context

- `BrainLifeContextService`
- `BrainMemoryContextService`
- `RelevantMemoryContextService`
- `BrainReasoningContextService`
- `BrainReasoningEngineService`
- `BrainStateService`
- `BrainOrchestratorService`

### Decision

- `BrainDecisionPipelineService`
- `DecisionExplanationService`
- `DecisionExplanationMemoryService`
- `DecisionLearningPolicyService`
- `DecisionOutcomeLearningService`
- `UnifiedDecisionEngineService`
- `DecisionConflictResolutionService`
- `GoalHierarchyService`
- `LongTermDecisionImpactService`
- `ScenarioPlanningService`
- `MultiScenarioSimulatorService`
- `DecisionAuditService`
- `DecisionSafetyGuardService`

### Execution

- `DecisionExecutionPlannerService`
- `PlanExecutionService`
- `PersistentPlanStateService`
- `AdaptiveReplanningService`
- `AdaptivePlanExecutionService`
- `DecisionReplanPolicyService`
- `DecisionExecutionStateService`
- `DecisionFeedbackLoopService`
- `DecisionExecutionGateService`
- `DecisionActionAdapterService`
- `DecisionExecutionCoordinatorService`
- `DecisionExecutionPolicyService`
- `DecisionExecutionHistoryService`
- `DecisionHistoryRetentionService`
- `ActionConfirmationIntelligenceService`

### Fitness

- `FitnessDecisionPolicyService`
- `FitnessProgressionService`
- `FitnessSessionOrchestratorService`
- `FitnessSkillUnlockService`
- `WorkoutPerformanceMemoryService`

### Coach / notifications

- `ProactiveCoachService`
- `CoachMessageService`
- `CoachCueEngineService`
- `ProactiveEventEngineService`
- `ProactiveDecisionQualityService`
- notification orchestration/deduplication/adaptation/device services

### Action adapters

The Brain also registers adapters for reminders, calendar, workouts, habits, and supplements so the decision layer can request real actions through one guarded execution path.

---

# 7. BrainLifeContext — the compact state contract

`brain-life-context.types.ts` is deliberately a summary contract instead of a raw database dump.

Current major areas include:

```text
habits
reminders
supplements
goals
fitness
  ├── primaryGoal
  ├── targetAreas
  ├── equipment
  ├── constraints
  └── performanceMemory
decisionMemory
outcomeMemory
adaptive user-learning data
```

`BrainLifeContextService` builds this snapshot from multiple domain services in parallel.

Conceptual flow:

```text
PostgreSQL + domain services
          ↓
BrainLifeContextService
          ↓
compact life snapshot
          ↓
BrainReasoningContextService
          ↓
BrainReasoningContext
```

This boundary is one of the most important anti-complexity rules in the project.

---

# 8. Decision pipeline — complete relationship map

```text
Current user request
        ↓
BrainReasoningContext
        ↓
Specialized policy?
   ┌────┴────┐
   │         │
  yes       no
   │         │
   ▼         ▼
Domain      BrainDecisionService
Policy            │
   └──────┬───────┘
          ▼
Historical Decision Learning
          ↓
Outcome Learning
          ↓
Confidence (bounded)
          ↓
Decision Explanation
          ↓
Execution / Coaching / UI
          ↓
Decision Audit
          ↓
Outcome Memory
```

Important safety property:

```text
history ≠ truth
execution success ≠ recommendation success
explanation ≠ post-hoc invention
```

---

# 9. Decision memory

### `DecisionExplanationMemoryService`

Uses `DecisionAuditEntry` history to calculate:

- recent decisions
- repeated reasons
- selected frequency
- stable/changing patterns
- configurable analysis windows (for example 90 days)

The output is compact enough to be injected into Brain context.

### `DecisionLearningPolicyService`

Converts stable history into a very small confidence adjustment. It intentionally limits the impact to avoid self-reinforcing loops.

---

# 10. Decision outcome learning

### `DecisionOutcomeLearningService`

Owns the difference between “the system executed an action” and “the user actually benefited.”

Sources:

```text
user      = explicit quality feedback
behavior  = inferred real-world feedback
system    = execution status only
```

The current rule is that system signals must not teach recommendation quality directly.

Quality learning requires enough evidence and uses a bounded confidence adjustment.

---

# 11. History retention and privacy

`DecisionHistoryRetentionService` provides the conceptual retention contract:

```text
1 month
3 months
6 months
1 year
unlimited
```

and a capability for deleting a recent-activity window:

```text
deleteRecentActivityHours
```

The product requirement behind this is:

- the Brain may need long-term memory for personalization;
- the user should not be forced to expose all of that memory in the UI;
- the user should have explicit control over retention and deletion.

The service is currently a policy layer; durable, production-grade retention deletion must remain explicitly wired to database cleanup jobs before being declared complete.

---

# 12. Fitness architecture

Fitness is a shared domain context, not three unrelated apps.

```text
Fitness Profile
    ├── Goals
    ├── Target Areas
    ├── Desired Outcome
    ├── Avoid Bulk
    ├── Equipment
    └── Constraints
             ↓
      Fitness Decision Policy
       ┌─────┼─────┐
       ▼     ▼     ▼
     Yoga   Cali  Gym
       │     │     │
       └─────┼─────┘
             ▼
     Session Orchestrator
             ▼
       Progression Engine
             ▼
     Performance Memory
             ▼
       Skill Unlocks
```

## 12.1 `fitness/`

The Fitness module owns the user-specific profile/context.

Verified current pieces include:

```text
controllers/fitness.controller.ts
models/fitness.model.ts
services/fitness-profile.service.ts
services/fitness-profile-persistence.service.ts
fitness.module.ts
```

The persistence service is the implementation behind `FitnessProfileService` and stores `FitnessProfileState` durably.

The controller exposes:

```text
GET  /fitness/profile
GET  /fitness/context
POST /fitness/profile
POST /fitness/equipment
DELETE /fitness/equipment/:id
POST /fitness/goal
POST /fitness/goal/from-text
```

## 12.2 Natural-language fitness goals

The user can speak in ordinary language:

> “I want my thighs slimmer and more defined.”

> “I want to look fitter but I do not want a lot of muscle bulk.”

> “Focus on my shoulders.”

The Fitness profile layer translates this into structured intent that the Brain can reason over.

---

# 13. Yoga

Verified current module services include:

```text
YogaLibraryService
YogaSessionGeneratorService
YogaCoachService
YogaMotionAnalysisService
```

Relationships:

```text
Goal + level + time
        ↓
YogaSessionGenerator
        ↓
Yoga exercises/flow
        ↓
YogaCoach
        ↓
Motion Analysis
```

The project also contains the foundation for a camera/pose pipeline with a replaceable on-device PoseProvider. The architectural goal is local landmark analysis rather than uploading training video unnecessarily.

### Hands-free target behavior

```text
Session starts
 ↓
Voice cue
 ↓
User performs movement
 ↓
Pose/motion feedback
 ↓
Transition cue
 ↓
Next movement
```

The current `CoachCueEngineService` produces device-agnostic cues in Persian or English. Native TTS/mobile playback is the provider boundary rather than a Brain responsibility.

---

# 14. Calisthenics

Verified current module services include:

```text
CalisthenicsLibraryService
CalisthenicsSessionGeneratorService
CalisthenicsCoachService
```

Purpose:

- bodyweight-first training
- equipment-aware progression
- beginner-to-elite skill levels
- strength / conditioning / mobility / skill tracks
- coach transitions and future live form feedback

Representative progression tree:

```text
Incline Push-up → Push-up → Decline Push-up
Split Squat → Pistol Squat
Pike Push-up → Handstand Push-up
Pull-up → Muscle-up
```

Skill unlocks are gated by prerequisites and performance evidence rather than by a raw user level alone.

---

# 15. Gym / Bodybuilding

Verified current module services include:

```text
GymLibraryService
GymSessionGeneratorService
```

The Generator considers:

- available equipment
- target area
- user level
- duration
- goal type
- avoid-bulk preference
- set/repetition/rest design

Representative exercises currently modeled include dumbbell, barbell, cable, split-squat, rowing, pressing, lateral-raise, RDL, plank and related patterns.

The library is intentionally extendable; it is not claimed to be a complete worldwide exercise database yet.

---

# 16. Shared Fitness progression

`FitnessProgressionService` supplies common progression logic:

```text
PROGRESS
STAY
REGRESS
DELOAD
```

Input signals include:

- form score
- completion rate
- recent perceived difficulty
- recovery

The goal is to prevent “more data = more intensity” mistakes.

Example:

```text
Excellent form + good recovery
      → PROGRESS

Excellent form + poor recovery
      → DELOAD

Poor form
      → REGRESS
```

---

# 17. Workout performance memory

`WorkoutPerformanceMemoryService` stores structured training results and produces trends such as:

```text
form trend
completion trend
recovery trend
difficulty trend
exercise trend
repetition trend
load trend
```

This is the bridge between a single session and long-term fitness personalization.

---

# 18. Budget and price intelligence

The repository contains dedicated intelligence for cost-aware decisions.

Verified `price-intelligence` responsibilities include:

```text
PriceIntelligenceService
PriceHistoryService
PriceAnalysisService
PriceSourceService
PriceSourceRegistryService
PriceHistoryStoreService
MarketAnalysisService
MarketBudgetImpactService
NightlyMarketIntelligenceService
PriceCollectionSchedulerService
MarketIntelligenceOrchestratorService
ProductMatchingService
```

This is the subsystem intended to support the “check prices regularly and use them for spending decisions” requirement.

The architecture separates:

```text
collection
   ↓
normalization / product matching
   ↓
price history
   ↓
market analysis
   ↓
budget impact
   ↓
Brain decision
```

Third-party websites or providers may still have access/cost/rate-limit constraints even if the application is designed around a free-to-user strategy.

`budget-intelligence` adds food cost, meal planning, and budget reasoning on top of raw price data.

---

# 19. Device intelligence

`device-intelligence` is the bridge between the life OS and phone/device capabilities.

Verified services include:

```text
DeviceIntelligenceService
ActivityTrackingService
HealthSyncService
```

It should own device-specific synchronization so that the Personal Brain remains platform-agnostic.

Future examples:

```text
steps
activity
health sync
sensor availability
camera capability
voice capability
notifications
```

---

# 20. Adaptive learning and user intelligence

### `adaptive-learning/`

Verified services include:

```text
AdaptiveLearningService
LearningMemoryService
FeedbackAnalysisService
```

This domain can learn behavioral patterns without making the Personal Brain itself responsible for every learning-storage detail.

### `user-intelligence/`

Owns user-specific understanding and learned profile data.

### `memory-intelligence/`

Owns memory retrieval/management concepts and acts as another boundary between raw historical data and compact reasoning context.

The architecture goal is:

```text
Raw history
 ↓
Memory intelligence
 ↓
Relevant memory
 ↓
Brain context
```

---

# 21. Planning, schedule and daily command center

The project contains dedicated domains for:

```text
calendar
daily
daily-command-center
schedule / planning inside Personal Brain
dashboard
reminders
notifications
```

The Personal Brain contains services for:

- Smart planning
- Full-day scheduling
- Dynamic replanning
- Schedule policy
- Schedule insights
- Schedule conflicts
- Schedule health
- Recovery analysis
- Next best action

Relationship:

```text
Calendar + reminders + habits + goals + capacity
                    ↓
            Planning / Schedule Policy
                    ↓
               Daily plan
                    ↓
            Next Best Action
                    ↓
             Proactive Coach
```

The user should experience this as one assistant rather than separate planner products.

---

# 22. Habits, reminders and supplements

These are durable domain modules with their own state and logs.

## Habits

Own:

- frequency
- target per week
- active state
- completion logs
- streak computation

## Reminders

Own:

- title/type
- scheduled time
- completion state
- scheduling indexes

## Supplements

Own:

- supplement definition
- dosage/frequency
- scheduled time
- daily logs

The Brain uses summaries of these domains; the domain modules remain the source of truth for their raw records.

---

# 23. Notifications and proactive coach

The system contains multiple notification intelligence layers:

```text
ProactiveNotificationPolicyService
NotificationOrchestratorService
NotificationDeduplicationService
NotificationFeedbackService
NotificationAdaptationService
NotificationChannelIntelligenceService
NotificationExperimentService
NotificationDeliveryQueueService
NotificationDeviceRegistryService
NotificationDeliveryDispatcherService
PushTokenHealthService
```

The important relationship is:

```text
Potential event
   ↓
Should I notify?
   ↓
Should I notify this user now?
   ↓
Which channel?
   ↓
Deduplicate
   ↓
Deliver
   ↓
Observe feedback
   ↓
Adapt future notification decisions
```

This is where Outcome Learning and decision explanations can eventually create much more personal proactive behavior.

---

# 24. Conversation engine

`conversation-engine` owns conversational context that is distinct from the deeper decision architecture.

The separation is intentional:

```text
Conversation
  = interaction layer

Personal Brain
  = decision / personalization layer
```

This prevents the conversational model from becoming the owner of durable business state.

---

# 25. Decision execution architecture

The execution layer is heavily guarded.

```text
Decision
  ↓
DecisionExecutionPlanner
  ↓
Confirmation intelligence (when needed)
  ↓
Execution gate
  ↓
Action adapter
  ↓
Execution policy / retry / timeout
  ↓
Execution history
  ↓
Audit
  ↓
Outcome signal
```

The action adapter layer includes adapters for:

```text
Reminder
Calendar
Workout
Habit
Supplement
```

The execution coordinator distinguishes:

```text
completed
blocked
unsupported
failed
dry_run
pending_confirmation
confirmation_invalid
```

A key correctness rule is that `completed` only means “the system executed the action.” It does not mean “the recommendation was beneficial.”

---

# 26. Database architecture

`apps/backend/prisma/schema.prisma` is the durable state map.

Verified top-level user relationships include:

```text
User
├── AuthAccount
├── Session
├── UserSettings
├── UserPreference
├── UserProfile
├── UserOnboarding
├── AssistantProfile
├── HealthProfile
├── NutritionProfile
├── DailyLog
├── NutritionLog
├── FoodItem
├── Meal
├── Recipe
├── Workout
├── Reminder
├── Habit / HabitLog
├── Supplement / SupplementLog
├── Notification
├── UserFact
├── UserBehavior
├── UserInsight
├── PlanExecutionState
├── FitnessProfileState
└── DecisionAuditEntry
```

Outcome learning adds `DecisionOutcome` through migrations, with an explicit `source` dimension to keep system execution signals separate from quality learning.

### Data ownership rule

Each domain owns the semantics of its records.

The Brain stores/reads summarized evidence but should not turn the whole database into one giant generic document.

---

# 27. Migration history as architecture history

The Prisma migration directory is not just database plumbing. It is part of the architecture story.

Important recent architectural migrations include:

```text
FitnessProfileState persistence
DecisionOutcome persistence
DecisionOutcome source separation
other date/tracking/domain migrations
```

When a model changes, the migration should be treated as part of the design review, not an afterthought.

---

# 28. Security map

Security boundaries are placed around:

```text
authentication
JWT-protected controllers
user-scoped database queries
device/notification registration
action execution confirmations
environment secrets
```

Important rule:

> Never trust a client-supplied user id when the JWT already identifies the user.

The project also follows the rule that API keys and privileged secrets must stay on the backend.

---

# 29. Privacy and local-first strategy

The product target is “free as much as possible” and privacy-aware.

Architectural principles:

- deterministic logic first
- open-source/local models where practical
- provider-agnostic interfaces
- on-device processing where possible
- send structured signals instead of full video where possible
- do not put secrets in the mobile app
- keep UI simpler than internal Brain knowledge

For camera coaching, the intended architecture is:

```text
Camera frame
   ↓
On-device pose provider
   ↓
Landmarks / confidence
   ↓
Motion analysis
   ↓
Coaching / explanation
```

rather than:

```text
Camera
   ↓
Upload full video
   ↓
Always-on paid cloud vision
```

The current PoseProvider implementation is a replaceable boundary; an actual on-device model/provider must still be installed and validated before the camera feature is considered production-complete.

---

# 30. Voice / hands-free coaching

`CoachCueEngineService` is the device-agnostic voice cue layer.

It currently produces cue types such as:

```text
instruction
countdown
transition
encouragement
safety
explanation
```

and supports Persian/English text output.

The intended runtime chain is:

```text
Session state
   ↓
CoachCueEngine
   ↓
Mobile/native TTS
   ↓
User hears cue
   ↓
User performs movement
   ↓
Motion / performance feedback
   ↓
Next cue
```

The backend should not become responsible for the audio driver itself; mobile owns native TTS playback.

---

# 31. Complete fitness loop

This is the most mature vertical slice currently being designed.

```text
User Goal
   ↓
Fitness Profile
   ↓
BrainLifeContext
   ↓
Fitness Decision Policy
   ↓
Yoga / Calisthenics / Gym
   ↓
Session Generator
   ↓
Coach / Camera / Motion
   ↓
Performance Memory
   ↓
Progression Engine
   ↓
Skill Unlock
   ↓
Outcome
   ↓
Long-term learning
```

This same architecture can later be reused for other domains.

---

# 32. Cross-domain universal decision loop

The goal is not to build “one smart fitness app plus random lifestyle pages.”

The intended final structure is:

```text
                    ┌─────────────┐
                    │ User State  │
                    └──────┬──────┘
                           ↓
                    ┌─────────────┐
                    │ Brain       │
                    │ Context     │
                    └──────┬──────┘
                           ↓
              ┌────────────┴────────────┐
              │                         │
        Domain Policy              Generic Policy
              │                         │
              └────────────┬────────────┘
                           ↓
                       Decision
                           ↓
                      Explanation
                           ↓
                     Safe Action
                           ↓
                       Outcome
                           ↓
                       Learning
```

Domains can plug into the same framework:

```text
Nutrition
Fitness
Calendar
Habits
Reminders
Supplements
Shopping
Budget
Price intelligence
Notifications
```

---

# 33. What was built over the life of the project

This section is intentionally chronological because architecture without history makes later maintenance harder.

## Phase A — foundation

- NestJS + TypeScript backend
- Prisma + PostgreSQL
- configuration/environment layer
- health foundation
- authentication
- Argon2 password hashing
- JWT/session support
- User/Profile/Settings/Onboarding foundations

## Phase B — lifestyle domains

- daily tracking
- nutrition logs
- food/meal/recipe foundations
- workouts
- habits
- reminders
- supplements
- calendar
- notifications
- dashboard and daily command center foundations

## Phase C — intelligence foundations

- assistant module
- user intelligence
- context engine
- memory intelligence
- decision engine
- adaptive learning
- brain integration

## Phase D — Personal Brain verticalization

- BrainLifeContext
- BrainReasoningContext
- Personal Brain orchestration
- generalized decisions
- planning/replanning
- proactive coach
- notification intelligence
- safe action execution
- decision audit

## Phase E — Fitness intelligence

- Fitness Profile
- persistent equipment/goal context
- Yoga
- Calisthenics
- Gym
- session orchestration
- shared progression logic
- performance memory
- skill unlock engine

## Phase F — Explainability and learning

- Decision Explanation Engine
- rejected/blocked reasoning
- proactive coach explanations
- long-term decision explanation memory
- generic historical learning policy
- Decision Outcome Learning
- execution-vs-quality separation

## Phase G — hands-free coaching foundation

- device-agnostic Coach Cue Engine
- Persian/English cues
- exercise start / countdown / transition / safety / explanation cues
- mobile/native TTS boundary

---

# 34. What is complete vs what is still a foundation

## Strong foundations already present

- authentication/user separation
- domain module boundaries
- database model foundation
- Brain context abstraction
- decision pipeline
- explainable decisions
- memory/history concepts
- outcome-learning concepts
- Fitness goal/equipment intelligence
- Yoga/Calisthenics/Gym session foundations
- progression and skill unlocking
- proactive coach foundations
- execution guardrails
- price intelligence architecture

## Still requires production hardening or real device integration

### Camera / pose

The PoseProvider boundary exists, but the production on-device pose model/provider must be installed, benchmarked, and tested on real devices.

### Voice playback

Cue generation exists; actual native TTS playback, background audio behavior, interruption rules, headset handling, and mobile battery behavior still require end-to-end device validation.

### Price providers

The price-intelligence architecture exists, including source registry, history, scheduling and nightly orchestration. Real external sources still need live-provider validation, rate-limit handling, terms-aware integration, and fallback behavior.

### Retention cleanup

Retention policy exists conceptually and in code, but actual production cleanup/deletion jobs must be wired and tested against every persistent memory domain before being declared finished.

### CI/production validation

The repository contains CI workflow foundations, but a current GitHub status check is not always available. An empty status result must never be described as “green.”

### Complete mobile UX

The backend is substantially ahead of the final mobile experience. The final mobile app still needs the full integration of auth, dashboard, assistant, fitness, camera, voice, notifications, and polished offline/local behavior.

---

# 35. Mobile/backend boundary

The backend owns:

```text
truth
rules
state
security
memory
decisions
execution
outcomes
```

The mobile app owns:

```text
presentation
interaction
device capabilities
camera frames
native TTS playback
local notifications / UX
animation
```

The two should communicate through stable contracts, not shared implementation details.

---

# 36. File/folder relationship rules

Anyone changing the tree should follow these rules:

1. A domain-specific rule belongs in the domain module, not in the controller.
2. Cross-domain decisions belong in Personal Brain policies/services.
3. Raw persistence belongs in Prisma/database boundaries.
4. UI/device-specific behavior belongs in mobile or device intelligence.
5. Explanation logic must consume actual evidence.
6. Memory must be bounded, relevant, and user-scoped.
7. Outcome quality must not be inferred merely from technical execution success.
8. New features must add tests and documentation.
9. New modules must declare clear ownership and dependencies.
10. Never add a second implementation of an existing cross-domain capability just because a new feature needs it; extend the shared service when the abstraction is truly shared.

---

# 37. “If I open the tree, where do I start?”

### I want the whole Brain

Start here:

```text
apps/backend/src/modules/personal-brain/
```

Then read:

```text
personal-brain.module.ts
controllers/personal-brain.controller.ts
services/brain-life-context.service.ts
services/brain-decision-pipeline.service.ts
services/decision-explanation.service.ts
services/decision-explanation-memory.service.ts
services/decision-learning-policy.service.ts
services/decision-outcome-learning.service.ts
```

### I want Fitness

Start:

```text
fitness/
```

Then:

```text
calisthenics/
yoga/
gym/
```

### I want database truth

Start:

```text
apps/backend/prisma/schema.prisma
apps/backend/prisma/migrations/
```

### I want the product story

Start:

```text
apps/backend/docs/00_PROJECT_OVERVIEW.md
apps/backend/docs/03_PROJECT_BRAIN_BOOK.md
apps/backend/docs/04_ARCHITECTURE_ATLAS.md
```

### I want the live tree itself

Use GitHub’s current tree as the exact structural source; this Atlas intentionally explains the architecture semantically so it does not become a stale giant copy of every generated/leaf file.

---

# 38. Future “hero” architecture target

The long-term target is a single user experience that feels like one person is helping the user everywhere:

```text
                   USER
                    │
        ┌───────────┴───────────┐
        │                       │
      CHAT                 PROACTIVE
        │                       │
        └───────────┬───────────┘
                    ↓
              PERSONAL BRAIN
                    ↓
       ┌────────────┼────────────┐
       ↓            ↓            ↓
   LIFE STATE     MEMORY     USER MODEL
       └────────────┼────────────┘
                    ↓
             DECISION SYSTEM
                    ↓
        ┌───────────┼────────────┐
        ↓           ↓            ↓
     PLANNING    FITNESS      NUTRITION
        ↓           ↓            ↓
     ACTION      COACH        RECIPES
        └───────────┼────────────┘
                    ↓
                OUTCOME
                    ↓
                 LEARN
                    ↓
              BETTER BRAIN
```

The user should not have to think in terms of “modules.” They should feel like they have one assistant that happens to have many capabilities.

---

# 39. Documentation maintenance contract

This Atlas is now the tree/relationship companion to the Brain Book.

Every major future feature should update:

```text
04_ARCHITECTURE_ATLAS.md
        +
03_PROJECT_BRAIN_BOOK.md
        +
relevant roadmap / domain documentation
```

For each new module, document:

```text
purpose
owner
inputs
outputs
persistence
security boundary
dependencies
consumers
tests
mobile relationship
memory relationship
explanation relationship
outcome relationship
```

For each major file, document it in the local module section if the file becomes part of a critical path.

For every architectural change, answer:

> “If somebody opens this repository six months from now, can they understand why this file exists and what it is connected to?”

If not, the architecture is not fully documented yet.

---

# 40. Final architectural summary

The project is no longer just a collection of lifestyle features.

The intended hierarchy is:

```text
FOUNDATION
  ↓
USER + SECURITY + DATA
  ↓
DOMAIN ENGINES
  ↓
CONTEXT + MEMORY
  ↓
PERSONAL BRAIN
  ↓
DECISION
  ↓
EXPLANATION
  ↓
SAFE EXECUTION / COACHING
  ↓
OUTCOME
  ↓
LEARNING
  ↓
PERSONALIZATION
```

That hierarchy is the core of the project.

The most important architectural promise is not “there are many features.”

It is:

> **The same Brain sees the user’s whole life, remembers what matters, explains why it acts, executes safely, learns from what actually happened, and becomes more useful over time without forcing the user to manage a complicated system manually.**

---

## Living status note — 2026-08-13

This atlas reflects the repository state and the architecture work completed so far. It intentionally distinguishes current implementations from future device/provider hardening. Percentages and roadmap estimates belong in the chat progress reports, not in this file, because they are implementation estimates rather than architectural facts.
