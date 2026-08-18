# Local Intelligence Core

The local provider is intentionally split into two layers:

- `LocalIntelligenceCoreService`: task-aware reasoning, lightweight deterministic planning, and context-aware Persian response composition.
- `LocalIntelligenceProvider`: thin provider boundary used by the provider router.

## Design goals

1. Keep common assistant work local and deterministic.
2. Avoid requiring a large model for intent, planning, calculations, and known domain responses.
3. Keep responses context-aware by consuming the existing `PersonalContext` shape.
4. Keep the provider boundary stable so a small on-device model can later replace or augment the deterministic core.
5. Avoid making AI a single point of failure: the provider router still owns capability, quota and failover decisions.

## Future local model slot

A future compact on-device model can be added behind `LocalIntelligenceCoreService` for tasks that benefit from semantic generation. Domain services must not call that model directly. This keeps model choice, quantization, memory policy, and device-tier selection centralized.

## Device-tier direction

The target is not "largest model possible". The target is the best perceived intelligence per MB of RAM, CPU time, latency, battery cost, and offline reliability. A device capability profile can later select between deterministic core, compact local model, and cloud-free provider fallbacks without changing application domains.
