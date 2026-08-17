# AI Provider Architecture

## Goal

The Personal Assistant must not depend on a single paid AI provider. Local capabilities are preferred, remote providers are optional fallbacks, and provider exhaustion must never make the core product unusable.

## Routing policy

1. Prefer a local provider when it supports the requested task.
2. Otherwise consider providers by descending priority.
3. Skip providers that do not advertise the requested capability.
4. Skip providers whose tracked quota is exhausted.
5. Cool down providers after failures and rate limits.
6. Continue to the next provider when a provider fails.
7. Keep deterministic domain actions independent from AI availability.

## Provider contract

Each provider exposes:

- `id`
- optional `metadata.priority`
- optional `metadata.capabilities`
- optional `metadata.local`
- `isAvailable()`
- `generate(request)`

Supported task categories are intentionally broader than today's implementation so voice, vision, planning, and future local models can be added without changing domain modules.

## Zero-cost rule

No domain service may call a concrete AI vendor directly. Domain code talks to the assistant/AI abstraction. Provider-specific SDKs, API keys, quotas, health checks, and fallback behavior belong behind provider adapters.

The first implementation is the local core. Remote providers will be added later as adapters and can be enabled or disabled without changing nutrition, fitness, household, memory, or assistant domain logic.

## Future layers

- persistent quota/usage telemetry
- provider health history
- task-specific routing policies
- local speech-to-text and text-to-speech
- local vision/pose inference
- provider configuration without secrets in the mobile app
- automatic provider rotation before free quotas are exhausted
