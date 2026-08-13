# Project Brain Book

> Living engineering document for **My Personal Assistant**.
>
> This file is intentionally long-form. Its job is not to be a polished marketing README; its job is to preserve the exact story of what the project can do, why each subsystem exists, how decisions are made, what data is used, and how files/folders connect.
>
> **Rule from this point forward:** every meaningful feature, architecture change, database change, safety rule, memory capability, integration, test layer, or mobile capability must add an entry to this document. The implementation is not considered fully documented until this book is updated.

---

## 0. What this project is

My Personal Assistant is being built as a local-first, privacy-aware, expandable lifestyle operating system with a specialized personal Brain rather than a generic chatbot glued onto an app.

The Brain is intended to know the user's current state, long-term goals, preferences, routines, schedules, nutrition state, fitness state, equipment, history, decision history and outcomes, then choose actions using deterministic domain logic and learned evidence. AI services are optional accelerators, not the architectural foundation.

The guiding principle is:

```text
User data
  ↓
Structured state
  ↓
Rules + domain engines + memory
  ↓
Decision
  ↓
Explanation
  ↓
Action / coaching
  ↓
Outcome
  ↓
Learning
  ↓
Better future decision
```

The project aims to make the user feel that the app knows them without making the interface feel crowded. The Brain can keep more knowledge internally than it exposes visually.

---

# 1. Core product philosophy

## 1.1 Specialized Brain, not generic chat

The main intelligence layer is a Personal Brain with domain-specific reasoning. The app should not require an external LLM for every small decision.

Examples of decisions intended to work primarily from structured logic:

- what to do next
- whether a reminder should move
- whether a workout should be harder or easier
- whether to use Yoga, Calisthenics, or Gym
- which exercise fits the user's available equipment
- whether a skill is ready to unlock
- how much training load to use
- whether a proactive notification is worth sending
- whether a schedule needs replanning
- why a decision was made
- whether previous decisions produced good outcomes

External AI can be added later for natural-language understanding, summarization, voice, or advanced vision, but the core architecture must remain useful without being permanently coupled to one AI provider.

## 1.2 User-specific personalization

The same input can produce different decisions for different users because the Brain reads:

- goals
- priorities
- preferences
- constraints
- available equipment
- performance trends
- recovery
- schedule/capacity
- habit history
- reminder history
- nutrition state
- decision history
- decision outcomes

## 1.3 Explain every important decision

The Brain must not silently change an important user-facing decision when a useful explanation can be shown.

Example:

> «این هفته تمرینت رو کمی سخت‌تر کردم چون فرم حرکت‌هات بهتر شده، بیشترِ جلساتت رو کامل کردی و Recovery هم مناسب بوده.»

The important architectural rule is that explanations are derived from the evidence actually used by the decision process. The system should not invent a post-hoc justification.

## 1.4 Learn from outcomes, not only from history

Remembering that a decision happened is not enough. The Brain also needs to know what happened afterward.

```text
Decision history ≠ learning
Decision + outcome + repeated evidence = learning signal
```

System execution status is deliberately separated from user-quality feedback. A successfully executed action is not automatically considered a good recommendation.

---

# 2. Current high-level architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                         Mobile App                           │
│                                                              │
│  UI / Dashboard / Coach / Fitness / Yoga / Calisthenics      │
│  Camera / future Voice / local notifications / UX            │
└──────────────────────────────┬───────────────────────────────┘
                               │ authenticated API
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                         Backend                               │
│                                                              │
│  Personal Brain                                               │
│   ├─ Context Builder                                         │
│   ├─ Reasoning Engine                                        │
│   ├─ Decision Pipeline                                       │
│   ├─ Decision Memory                                         │
│   ├─ Outcome Learning                                        │
│   ├─ Explanation Engine                                      │
│   ├─ Proactive Coach                                         │
│   ├─ Planner / Scheduler                                     │
│   └─ Execution Coordinator                                   │
│                                                              │
│  Domain Engines                                               │
│   ├─ Nutrition                                               │
│   ├─ Fitness                                                  │
│   ├─ Yoga                                                    │
│   ├─ Calisthenics                                            │
│   ├─ Gym                                                      │
│   ├─ Habits                                                   │
│   ├─ Reminders                                                │
│   ├─ Supplements                                              │
│   ├─ Calendar / Planning                                      │
│   └─ Notifications                                            │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                        PostgreSQL                             │
│                                                              │
│ User state / goals / habits / reminders / supplements        │
│ nutrition / workouts / fitness profile / decision audit      │
│ decision outcomes / execution state / long-term memory       │
└──────────────────────────────────────────────────────────────┘
```

---

# 3. Repository architecture map

The repository currently has a monorepo-style structure with separate app areas and shared root tooling.

```text
/
├── .github/
│   └── workflows/
│       ├── backend-ci.yml
│       └── mobile-ci.yml
│
├── apps/
│   ├── backend/
│   │   ├── docs/
│   │   │   ├── 00_PROJECT_OVERVIEW.md
│   │   │   ├── 01_ARCHITECTURE.md
│   │   │   ├── 02_ROADMAP.md
│   │   │   └── 03_PROJECT_BRAIN_BOOK.md   ← this file
│   │   │
│   │   ├── prisma/
│   │   │   └── migrations/
│   │   │
│   │   └── src/modules/
│   │       ├── personal-brain/
│   │       ├── fitness/
│   │       ├── yoga/
│   │       ├── calisthenics/
│   │       ├── gym/
│   │       ├── nutrition/
│   │       ├── habits/
│   │       ├── reminders/
│   │       ├── supplements/
│   │       ├── calendar/
│   │       ├── workout/
│   │       └── supporting intelligence / infrastructure modules
│   │
│   └── mobile/
│       └── mobile application layers
│
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── .gitignore
```

The current repository also contains dedicated backend documentation and CI workflow definitions. The exact tree is intentionally maintained by Git rather than copied into a huge static list here; this document explains the meaning and connections of the important parts.

---

# 4. Personal Brain architecture

The Brain is the most important domain.

## 4.1 Brain module layout

```text
apps/backend/src/modules/personal-brain/
├── controllers/
│   └── personal-brain.controller.ts
│
├── dto/
│   └── request contracts
│
├── services/
│   ├── Context services
│   ├── Reasoning services
│   ├── Decision services
│   ├── Memory services
│   ├── Explanation services
│   ├── Planning / scheduling
│   ├── Notifications / coach
│   ├── Execution
│   ├── Fitness orchestration
│   └── Safety / guardrails
│
├── types/
│   ├── brain-life-context.types.ts
│   ├── brain-decision.types.ts
│   └── other Brain contracts
│
└── personal-brain.module.ts
```

## 4.2 BrainLifeContext

`BrainLifeContext` is the compact state snapshot that the Brain can reason over.

It contains areas such as:

```text
habits
reminders
supplements
goals
fitness
decisionMemory
performanceMemory / trend information
adaptive user-learning data
```

The important design rule is that the context contains summaries, not an uncontrolled dump of the entire database.

This keeps the reasoning layer stable while detailed data remains inside domain services.

## 4.3 BrainReasoningContext

The Brain reasoning context combines the current user input with structured current state and reasoning metadata.

Conceptually:

```text
User message
+
BrainLifeContext
+
User understanding
+
Relevant memory
+
Current uncertainties
        ↓
BrainReasoningContext
```

## 4.4 BrainDecisionPipeline

The current pipeline concept is:

```text
BrainReasoningContext
        ↓
Specialized policy if applicable
        ↓
General Brain Decision
        ↓
Learning adjustments
        ↓
Explanation
        ↓
BrainDecisionPipelineResult
```

Fitness currently has a specialized policy. The architecture leaves room for more domain policies without rewriting the general Brain.

---

# 5. Decision making: what the Brain looks at

The Brain is intentionally multi-signal.

## 5.1 Current-state signals

Examples:

- what the user asked now
- current goals
- priority
- remaining time
- schedule pressure
- reminders
- habit completion
- nutrition targets/status
- fitness targets
- available equipment
- current constraints
- current recovery/performance data

## 5.2 Long-term signals

Examples:

- repeated decisions
- repeated reasons
- decision frequencies
- performance trends
- recurring preferences
- historical outcomes
- stable user behavior
- long-term goal trajectory

## 5.3 Safety rule for historical learning

Historical information must not blindly override current context.

The current design uses conservative thresholds and bounded confidence effects.

Example policy:

```text
insufficient history → no historical boost
unstable history      → no historical boost
stable + repeated    → small bounded boost
strong negative      → bounded downward adjustment
```

---

# 6. Decision Explanation Engine

## 6.1 Purpose

Every meaningful decision should be explainable.

The explanation layer produces structured output such as:

```text
summary
 details
 confidence
 reasons
 rejectedReasons
 blockedReasons
 conflictReason
 historical reasons when available
```

## 6.2 Explanation levels

### Short UI explanation

One natural sentence.

### Detail view

Evidence and the main reasons.

### History view

Past decisions and recurring decision patterns.

## 6.3 Example

```text
Decision:
Increase training difficulty

Evidence:
- form trend improved
- completion trend improved
- recovery acceptable
- previous level became easy

User-facing explanation:
«سطح تمرینت رو کمی بالا بردم چون فرم حرکت‌هات بهتر شده، بیشتر جلساتت رو کامل کردی و سطح قبلی دیگه به اندازه قبل چالش‌برانگیز نیست.»
```

## 6.4 Important rule

The Explanation Engine must describe evidence that really influenced the decision. It must not invent reasons after the fact.

---

# 7. Decision Memory

Decision history is stored in the audit layer.

The memory service can summarize:

- recent decisions
- repeated reasons
- selected-frequency patterns
- stable vs changing decision patterns
- time windows such as 90 days

The purpose is to let the Brain recognize patterns such as:

> «در هفته‌های اخیر وقتی ظرفیت روزت پایین بوده، پیشنهادهای کوتاه‌تر بیشتر تکرار شده‌اند.»

Memory can be user-visible when appropriate, but the Brain may store more information than the UI shows.

---

# 8. Outcome Learning

## 8.1 Why it exists

A decision being executed successfully does not mean the decision was personally good.

Therefore the project distinguishes:

```text
System execution signal
        ≠
User-quality outcome
```

## 8.2 Outcome types

```text
positive
neutral
negative
```

## 8.3 Outcome sources

```text
user
system
behavior
```

### System

Answers questions like:

> Did the action actually execute?

### User

Answers:

> Was this helpful / appropriate / good for me?

### Behavior

Answers indirectly:

> What did the user actually do afterward?

Only high-quality user/behavior evidence should meaningfully teach recommendation quality.

## 8.4 Outcome learning loop

```text
Decision
 ↓
Action
 ↓
Outcome
 ↓
Outcome profile
 ↓
Confidence adjustment
 ↓
Next decision
```

The adjustment is deliberately bounded and requires enough evidence.

---

# 9. Fitness architecture

Fitness is a shared intelligence layer with multiple training disciplines.

```text
Fitness
├── Gym
├── Calisthenics
├── Yoga
├── Cardio / future endurance
└── Mobility / Recovery
```

The important design decision is that these disciplines share context instead of becoming separate disconnected apps.

## 9.1 Shared Fitness Context

Includes concepts such as:

- primary goal
- target body areas
- desired outcome
- avoid-bulk preference
- equipment
- constraints
- preferred discipline
- performance memory

## 9.2 Equipment-aware intelligence

The user can add or remove equipment.

Examples:

```text
none

dumbbells
barbell
bench
pull-up bar
parallel bars
rings
resistance band
cable machine
```

Generators should never invent equipment the user does not have.

---

# 10. Fitness Goal Engine

The user can express goals in normal language.

Examples:

> «می‌خوام ران‌هام لاغرتر و خوش‌فرم‌تر بشن.»

> «می‌خوام خوش‌فرم‌تر بشم ولی نمی‌خوام خیلی عضلانی بشم.»

> «فقط روی سرشانه‌هام کار کن.»

The system translates human language into structured goals such as:

```text
goal kind
primary target
body areas
desired outcome
avoid-bulk preference
constraints
priority
```

The Brain then chooses a training strategy from the structured goal.

The system must not promise biologically impossible spot-reduction guarantees. It can optimize training focus and overall fat-loss strategy while keeping claims scientifically honest.

---

# 11. Fitness Decision Policy

The Brain compares:

```text
Yoga
Calisthenics
Gym
```

using:

- goal
- target area
- equipment
- constraints
- avoid-bulk preference
- current request
- historical evidence when sufficiently stable
- outcome evidence when sufficient

The result is a ranked discipline list with reasons.

---

# 12. Fitness Session Orchestration

After selecting the discipline, the system routes to the corresponding generator.

```text
Brain
 ↓
Fitness Decision Policy
 ↓
Fitness Session Orchestrator
 ├── Yoga Generator
 ├── Calisthenics Generator
 └── Gym Generator
```

This is important because the Brain selects the strategy while the domain engine knows the exercise details.

---

# 13. Calisthenics

Calisthenics / Bodyweight Training is a first-class discipline.

## 13.1 Levels

The design supports progressive levels from beginner to elite.

## 13.2 Equipment-aware design

A user with no equipment can still receive a full bodyweight session.

A user who later adds equipment unlocks more exercises.

## 13.3 Progression tree

Examples:

```text
Incline Push-up
      ↓
Push-up
      ↓
Decline Push-up

Split Squat
      ↓
Pistol Squat

Pike Push-up
      ↓
Handstand Push-up

Pull-up
      ↓
Muscle-up
```

## 13.4 Skill Unlock Engine

A skill is not unlocked only because a user has a nominal level.

The Brain checks:

- prerequisite exercise
- recent performance
- form
- completion
- recovery
- trend
- enough evidence

States conceptually include:

```text
locked
ready
unlocked
```

---

# 14. Gym / Bodybuilding

Gym is a separate engine so that gym-specific exercise and progression logic remains maintainable.

Initial foundation includes exercises such as:

- Goblet Squat
- Dumbbell Bench Press
- Dumbbell Row
- Lat Pulldown
- Lateral Raise
- Romanian Deadlift
- Split Squat
- Seated Cable Row
- Weighted Plank

Each exercise can carry information about:

- level
- equipment
- target/focus
- compound/isolation character
- sets
- reps
- rest
- coach cues

The generator uses equipment and user goals rather than returning a fixed generic program.

---

# 15. Yoga

Yoga is treated as an independent discipline with a large planned library, multiple levels and future adaptive coaching.

The long-term design includes:

- warm-up
- main flow
- recovery / mobility
- cooldown
- progression
- spoken guidance
- motion analysis
- hands-free session flow

---

# 16. Shared Fitness Progression Engine

One progression engine is intended to serve multiple disciplines.

Inputs:

```text
form score
completion rate
recent difficulty
recovery score
history/trend
```

Outputs:

```text
PROGRESS
STAY
REGRESS
DELOAD
```

Important behavior:

- excellent performance + good recovery → progress
- poor form → regress
- insufficient evidence → stay
- poor recovery → deload even if form is good

This prevents the Brain from blindly increasing difficulty.

---

# 17. Workout Performance Memory

The project stores detailed workout performance signals such as:

- discipline
- exercise
- form
- completion
- perceived difficulty
- recovery
- reps
- sets
- duration
- load
- timestamp

The Brain can calculate multi-week trends instead of relying only on the previous session.

Example:

```text
Push-up
8 → 10 → 14 → 18 reps
Form
72% → 78% → 88% → 92%
```

That pattern can trigger progression or skill unlock decisions.

---

# 18. Camera / Pose architecture

The planned architecture separates camera capture from pose intelligence.

```text
Camera
 ↓
Frame Bridge
 ↓
Pose Provider
 ↓
Pose Frame / Landmarks
 ↓
Motion Analyzer
 ↓
Assessment
 ↓
Coach Cue
```

A key privacy and cost goal is to keep pose analysis on-device whenever possible and avoid uploading raw video when structured landmarks are enough.

A provider abstraction allows the real on-device pose model to be swapped later without rewriting the Yoga/fitness domain.

Important current status: the pipeline contract and bridge architecture exist, but the final production-grade on-device pose provider/model still needs to be selected, integrated, verified on-device, and benchmarked.

---

# 19. Hands-free Coach / Voice architecture

The backend now has a device-agnostic **Coach Cue Engine**.

It can produce cue types such as:

- instruction
- countdown
- transition
- encouragement
- safety
- explanation

Example Persian cue:

> «حرکت رو شروع کن. آروم و کنترل‌شده حرکت کن.»

The mobile app should eventually map these cues to local/native TTS so the user can train for long periods without holding the phone.

This architecture deliberately keeps TTS implementation out of Brain logic.

---

# 20. Proactive Coach

The Coach is not merely a question-answer endpoint.

It can generate proactive suggestions based on current context and can now carry an explanation.

The intended interaction is:

```text
Suggestion
 ↓
Why
 ↓
Optional details
```

This helps the user feel understood without flooding the interface with internal Brain details.

---

# 21. Scheduling and Planning

The project includes planning/scheduling subsystems for:

- full-day schedule
- daily capacity
- conflicts
- recovery
- replanning
- next best action
- schedule health
- proactive notifications

The broader Brain architecture treats schedule decisions as another domain policy, not as unrelated calendar CRUD.

---

# 22. Notifications

The project contains infrastructure for:

- notification orchestration
- deduplication
- adaptation
- delivery queue
- device registry
- feedback
- notification channels
- experiments
- health checks

The long-term goal is to prevent notification spam by making send/don't-send a Brain decision with memory and outcome feedback.

---

# 23. Action execution and safety

Decision execution is separated from decision making.

```text
Decision
 ↓
Execution Gate
 ↓
Confirmation if required
 ↓
Action Adapter
 ↓
Execution Policy
 ↓
Execution History
 ↓
Outcome signal
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

Safety boundaries belong here, not inside arbitrary UI code.

---

# 24. User privacy and security principles

The current architectural rules include:

- user identity should come from authenticated context / JWT rather than trusted request-body IDs
- User-scoped data must not leak across accounts
- API keys must not be placed in the mobile app
- raw camera/video should not be uploaded when structured on-device landmarks are sufficient
- system execution outcomes should not be mistaken for user-quality outcomes
- sensitive data should have retention controls
- long-term memory should be separable from what the UI shows

---

# 25. Data retention / history philosophy

The product should support configurable history retention because users may want:

- last hour
- last day
- last month
- last three months
- indefinite history

The UI should allow deleting recent activity while the system independently manages longer-term memory with explicit retention policies.

Important product principle:

```text
Brain memory can be rich
UI memory can be simple
```

---

# 26. Database architecture map

The backend uses PostgreSQL through Prisma and SQL migrations.

Important current model groups include:

```text
User
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
├── DecisionAuditEntry
└── DecisionOutcome
```

The database is intentionally separated into user state, activity history, plan execution, domain state and Brain audit/learning data.

---

# 27. Important current files and what they do

## Brain entry / orchestration

`apps/backend/src/modules/personal-brain/personal-brain.module.ts`

Owns dependency injection and connects the Brain's many services.

`apps/backend/src/modules/personal-brain/controllers/personal-brain.controller.ts`

Exposes authenticated Brain, fitness, explanation, outcome, schedule, coach and related endpoints.

## Brain context

`apps/backend/src/modules/personal-brain/services/brain-life-context.service.ts`

Builds the daily structured snapshot used by the Brain, including fitness performance memory and long-term decision memory.

`apps/backend/src/modules/personal-brain/types/brain-life-context.types.ts`

Defines the stable contract of the Brain context.

## Decisions

`brain-decision.service.ts`

Handles general Brain decision questions.

`fitness-decision-policy.service.ts`

Specialized Fitness branch-selection policy.

`brain-decision-pipeline.service.ts`

Combines domain policy, general decision logic, learning adjustments and explanations.

## Memory

`decision-explanation-memory.service.ts`

Reads decision history patterns.

`decision-learning-policy.service.ts`

Applies bounded historical evidence to decision confidence.

`decision-outcome-learning.service.ts`

Stores and analyzes decision outcomes.

`workout-performance-memory.service.ts`

Stores and summarizes workout performance trends.

## Explanation

`decision-explanation.service.ts`

Transforms actual decision evidence into user-readable reasons.

`proactive-coach.service.ts`

Generates proactive suggestions.

`coach-cue-engine.service.ts`

Turns workout/coaching events into device-agnostic spoken cues.

## Execution

`decision-execution-coordinator.service.ts`

Runs approved actions, records execution history, updates audit state and produces system outcome signals.

---

# 28. Brain reasoning in plain English

When a request arrives, the intended sequence is roughly:

### Step A — Understand the request

Example:

> «امروز ۳۰ دقیقه وقت دارم و می‌خوام روی ران‌هام کار کنم.»

The request is normalized into intent and constraints.

### Step B — Load the user context

Brain loads relevant structured state.

It may know:

- the user wants body sculpting
- the user prefers less bulk
- no gym equipment is available
- recent workout recovery is low
- similar decisions worked well in the past

### Step C — Run the relevant domain policy

Fitness policy ranks Yoga / Calisthenics / Gym.

### Step D — Check guardrails and uncertainty

If required information is missing or unsafe, the Brain can refuse to make a firm decision and ask for more context.

### Step E — Apply bounded learning

Historical decision memory and outcome learning can slightly alter confidence when evidence is strong enough.

### Step F — Produce the decision

The result includes a recommendation, next action and confidence.

### Step G — Explain it

The Explanation Engine produces:

- short reason
- detail reason
- blocked/rejected reasons
- confidence
- historical evidence when applicable

### Step H — Execute when appropriate

Execution goes through the gate, confirmation and adapters.

### Step I — Learn from what happened

System execution tells us whether the action executed. User/behavior outcome tells us whether the decision was actually good for the user.

---

# 29. Example: a full Fitness decision

User:

> «می‌خوام ران‌هام لاغرتر و خوش‌فرم‌تر بشن، وسیله هم ندارم.»

Brain state may become:

```text
Goal:
body sculpt / fat-loss oriented

Target:
thighs

Avoid bulk:
true

Equipment:
none

Performance:
recent form improving
recovery acceptable

Decision history:
Calisthenics has been used repeatedly with stable rationale

Outcome history:
previous user feedback is mostly positive
```

Decision:

```text
Discipline = Calisthenics
```

Explanation:

> «کالیستنیکس رو انتخاب کردم چون وسیله‌ای نداری، با هدف فرم‌دهی پایین‌تنه‌ات هماهنگه و محدودیت حجم زیاد هم برات مهمه. تمرین‌های اخیرت هم نشون می‌دن که آماده‌ی پیشروی کنترل‌شده‌ای.»

Session generator then builds the concrete workout.

After execution:

```text
system outcome = neutral / negative if execution failed
user outcome   = positive / neutral / negative
behavior       = optional later signal
```

That evidence returns to future decisions.

---

# 30. What is intentionally NOT claimed yet

To keep this document trustworthy, the following are not considered complete merely because scaffolding exists:

- final production mobile UI
- final production on-device pose model
- verified camera inference performance across target devices
- full production voice/TTS pipeline
- every external product-price source
- every shopping connector
- full production notification delivery verification
- final App Store / Play Store packaging
- a fully validated medical-grade body assessment system
- automatic claims of localized fat loss

A feature is only marked complete in a future entry when the corresponding runtime, integration and tests are actually verified.

---

# 31. Documentation change log

## Entry: Foundation of the long-term decision memory concept

The project established the rule that Brain memory is richer than UI-visible memory and that decision history should be retained independently from what the user sees.

## Entry: Fitness domain expansion

Added the concept of a unified Fitness context with goals, target areas, equipment, constraints and discipline selection.

## Entry: Yoga / Calisthenics / Gym split

Created separate domain responsibilities while keeping a shared Fitness decision layer.

## Entry: Calisthenics progression

Added equipment-aware bodyweight programming, progression relationships and skill-unlock logic.

## Entry: Gym engine

Added equipment-aware gym exercise selection and session generation.

## Entry: Shared Fitness progression

Added `progress / stay / regress / deload` behavior based on form, completion, difficulty and recovery.

## Entry: Workout performance memory

Started storing multi-week performance signals to let Brain reason over trends instead of only the last session.

## Entry: Decision Explanation Engine

Made decision evidence user-visible in concise or detailed form.

## Entry: Proactive explanation

Extended explanations into proactive Coach suggestions.

## Entry: Long-term decision explanation memory

Allowed Brain to see repeated historical reasons and stable/changing patterns.

## Entry: General Decision Learning

Moved bounded historical evidence from Fitness-only logic into the general Brain decision pipeline.

## Entry: Outcome Learning

Added explicit `DecisionOutcome` storage and bounded confidence adjustments based on repeated quality outcomes.

## Entry: Outcome source separation

Separated `user`, `behavior`, and `system` outcome sources so successful execution is not automatically interpreted as a positive user-quality signal.

## Entry: Hands-free Coach Cue foundation

Added a device-agnostic Coach Cue Engine for instruction, countdown, transition, safety and explanation cues, with Persian and English output contracts. Mobile/native TTS remains the execution layer.

---

# 32. Future change-log rule

For every future implementation batch, add an entry with exactly this structure:

```markdown
## Entry: <date / feature title>

### Goal
What problem this change solves.

### User-facing capability
What the user can now do.

### Brain behavior
What the Brain now knows, reads, decides or learns.

### Files/folders added
Exact paths.

### Files changed
Exact paths.

### Database changes
Models / migrations / retention implications.

### Connections
What calls what.

### Tests
Exact tests added or run.

### Known limitations
What is still scaffolded, unverified or pending.
```

This section is a permanent contract for future development.

---

# 33. Final architecture picture

```text
                                  ┌─────────────────┐
                                  │     MOBILE      │
                                  │ UI / Camera /   │
                                  │ Voice / Coach   │
                                  └────────┬────────┘
                                           │
                                           ▼
                         ┌────────────────────────────────┐
                         │       PERSONAL BRAIN API       │
                         └───────────────┬────────────────┘
                                         │
                ┌────────────────────────┼────────────────────────┐
                │                        │                        │
                ▼                        ▼                        ▼
       ┌────────────────┐      ┌──────────────────┐      ┌─────────────────┐
       │ Context Engine │      │ Decision Engine  │      │ Execution Layer │
       └───────┬────────┘      └────────┬─────────┘      └────────┬────────┘
               │                        │                         │
               │                        ▼                         ▼
               │              ┌──────────────────┐      ┌─────────────────┐
               │              │ Explanation      │      │ Outcome Capture │
               │              │ Engine           │      │ system/user/beh │
               │              └────────┬─────────┘      └────────┬────────┘
               │                       │                         │
               └───────────────┬───────┴──────────────┬──────────┘
                               ▼                      ▼
                     ┌────────────────────────────────────┐
                     │        LONG-TERM BRAIN MEMORY      │
                     │ decisions / outcomes / behavior   │
                     │ trends / performance / insights   │
                     └──────────────────┬─────────────────┘
                                        │
                                        ▼
                             ┌────────────────────┐
                             │    PostgreSQL      │
                             └────────────────────┘

Domain engines under the Brain:

        ┌──────────┬──────────────┬──────────┬───────────────┐
        │ Nutrition│ Fitness      │ Schedule │ Notifications │
        ├──────────┼──────────────┼──────────┼───────────────┤
        │ Gym      │ Calisthenics │ Yoga     │ Habits        │
        ├──────────┼──────────────┼──────────┼───────────────┤
        │Reminders │ Supplements  │ Calendar │ Future domains│
        └──────────┴──────────────┴──────────┴───────────────┘
```

---

# 34. The one-line definition of the architecture

```text
A specialized personal Brain reads structured life context + long-term memory,
makes bounded domain-aware decisions, explains the evidence, executes safely,
records outcomes, and improves future decisions without requiring a single
cloud AI provider to be the core of the application.
```

---

# 35. Current implementation honesty

This document intentionally distinguishes **architecture already implemented** from **architecture planned or partially scaffolded**.

When a future change is only a contract/scaffold, it must be described as such.

When an integration is verified, the future changelog must record the verification method.

When the user finally opens the finished app, this document should be enough to reconstruct:

1. what the app can do,
2. how each capability works,
3. why the Brain makes each type of decision,
4. where the data is stored,
5. how the modules are connected,
6. how memory changes future decisions,
7. which parts are on-device vs backend,
8. and the exact chain of work that built the project.
