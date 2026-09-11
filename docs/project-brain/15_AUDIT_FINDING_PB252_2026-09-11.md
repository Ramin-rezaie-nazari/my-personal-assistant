# PB-252 — Content Recommendation service has no active consumer

- Status: PROVISIONAL — requires final duplicate/reachability reconciliation before catalog freeze.
- Location: `apps/backend/src/modules/content/content-recommendation.service.ts`, `apps/backend/src/modules/content/content.module.ts`
- Problem: `ContentRecommendationService` is provided and exported by `ContentModule`, but repository search on target main finds the service definition/module registration without an active runtime consumer. This means the recommendation-ranking implementation is present in the source graph but is not evidenced as participating in an active application request/command path.
- Evidence: `ContentRecommendationService` is defined in `content-recommendation.service.ts`; `content.module.ts` registers it in `providers` and `exports`. Repository-wide search for the exact service symbol returned those service/module occurrences only. fileciteturn260file0 fileciteturn260file1
- Impact: Recommendation logic can remain effectively unreachable despite appearing architecturally available; callers may be bypassing it or using parallel recommendation logic.
- Reconciliation note: Do not create a separate finding for `ConversationStyleService` based solely on provider/export presence. `ResponsePlanningService` is an active consumer, so that earlier provisional observation is withdrawn.
