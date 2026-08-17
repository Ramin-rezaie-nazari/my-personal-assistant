# Personal Context Contract

`PersonalContextService` is the boundary between the Assistant/AI Core and the user's current life state.

It intentionally returns normalized context instead of exposing Prisma queries or domain service details to AI consumers.

## Included context

- user identity and language/timezone
- current request and date key
- recent conversation context and last action
- today's nutrition summary and goals
- Personal Brain life context: goals, habits, reminders, supplements, fitness, adaptive learning, and decision memory

## Design rules

1. Domain services remain the source of truth.
2. AI consumers depend on the context contract, not Prisma models.
3. Adding a domain context should extend this contract without changing provider routing.
4. The context is read-only during an AI run. Mutations happen through explicit actions.
5. The date key is explicit when supplied and otherwise derived centrally.

This boundary is intended to support the future offline/local AI core, voice, planning, proactive coaching, and multi-domain reasoning without coupling those capabilities to individual modules.
