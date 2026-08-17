# AI Core Gateway

`AiCoreGatewayService` is the provider-agnostic boundary for application features that need AI capabilities.

## Responsibilities

- Expose stable task-oriented methods to the rest of the assistant domain.
- Forward requests to `AiProviderRouterService`.
- Preserve task identity in the response.
- Keep provider selection, quota tracking, cooldowns, and failover outside domain services.

## Supported tasks

- intent-understanding
- text-generation
- planning
- voice-transcription
- voice-synthesis
- vision

## Design rule

Domain services must depend on the AI Core Gateway rather than importing a concrete AI provider or implementing provider failover themselves.

The gateway is intentionally thin. Business rules, safety checks, deterministic calculations, user state, and action execution remain outside the AI provider layer.

This keeps the application local-first and allows additional free providers or local models to be added without changing domain modules.
