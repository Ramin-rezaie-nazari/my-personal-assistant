# Project Brain Book

> Living engineering document for **My Personal Assistant**.
>
> This file is intentionally long-form. Its job is not to be a polished marketing README; its job is to preserve the exact story of what the project can do, why each subsystem exists, how decisions are made, what data is used, and how files/folders connect.
>
> **Architecture map:** see **[04_ARCHITECTURE_ATLAS.md](./04_ARCHITECTURE_ATLAS.md)** for the complete repository tree, module ownership, file relationships, database map, decision pipeline, memory layers, Fitness architecture, and production-readiness boundaries.
>
> **Rule from this point forward:** every meaningful feature, architecture change, database change, safety rule, memory capability, integration, test layer, or mobile capability must add an entry to this document. The implementation is not considered fully documented until the book is updated.

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

A... (truncated)