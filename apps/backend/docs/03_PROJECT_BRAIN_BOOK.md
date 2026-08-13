# Project Brain Book

> Living engineering document for **My Personal Assistant**.
>
> This file is intentionally long-form. Its job is not to be a polished marketing README; its job is to preserve the exact story of what the project can do, why each subsystem exists, how decisions are made, what data is used, and how files/folders connect.
>
> **Architecture map:** see **[04_ARCHITECTURE_ATLAS.md](./04_ARCHITECTURE_ATLAS.md)** for the complete repository tree, module ownership, file relationships, database map, decision pipeline, memory layers, Fitness architecture, and production-readiness boundaries.
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
