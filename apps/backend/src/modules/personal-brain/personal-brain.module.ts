import { Module } from '@nestjs/common';
import { ConversationEngineModule } from '../conversation-engine/conversation-engine.module';
import { DailyModule } from '../daily/daily.module';
import { WorkoutModule } from '../workout/workout.module';
import { BrainIntegrationModule } from '../brain-integration/brain-integration.module';
import { ContextEngineModule } from '../context-engine/context-engine.module';
import { MemoryIntelligenceModule } from '../memory-intelligence/memory-intelligence.module';
import { UserIntelligenceModule } from '../user-intelligence/user-intelligence.module';
import { PersonalBrainController } from './controllers/personal-brain.controller';
import { BrainDecisionPipelineService } from './services/brain-decision-pipeline.service';
import { BrainDailyStatusService } from './services/brain-daily-status.service';
import { BrainLifeContextService } from './services/brain-life-context.service';
import { BrainMemoryContextService } from './services/brain-memory-context.service';
import { BrainNutritionTargetsService } from './services/brain-nutrition-targets.service';
import { BrainOrchestratorService } from './services/brain-orchestrator.service';
import { BrainReasoningContextService } from './services/brain-reasoning-context.service';
import { BrainReasoningEngineService } from './services/brain-reasoning-engine.service';
import { BrainStateService } from './services/brain-state.service';
import { BrainWeeklyStatusService } from './services/brain-weekly-status.service';
import { BrainWorkoutStatusService } from './services/brain-workout-status.service';
import { IntentionAnalysisService } from './services/intention-analysis.service';
import { MemoryManagerService } from './services/memory-manager.service';
import { RelevantMemoryContextService } from './services/relevant-memory-context.service';
import { ResponsePlanningService } from './services/response-planning.service';
import { UserContextService } from './services/user-context.service';
import { UserUnderstandingService } from './services/user-understanding.service';
import { SmartPlanningService } from './services/smart-planning.service';
import { FullDaySchedulerService } from './services/full-day-scheduler.service';
import { DynamicReplanningService } from './services/dynamic-replanning.service';
import { SchedulePolicyService } from './services/schedule-policy.service';
import { ScheduleInsightsService } from './services/schedule-insights.service';
import { NextBestActionService } from './services/next-best-action.service';
import { ScheduleConflictService } from './services/schedule-conflict.service';
import { ProactiveNotificationPolicyService } from './services/proactive-notification-policy.service';
import { DailyCapacityService } from './services/daily-capacity.service';
import { ScheduleExplanationService } from './services/schedule-explanation.service';
import { ScheduleHealthService } from './services/schedule-health.service';
import { ReplanPolicyService } from './services/replan-policy.service';
import { ScheduleRecoveryService } from './services/schedule-recovery.service';
import { ProactiveCoachService } from './services/proactive-coach.service';
import { CoachMessageService } from './services/coach-message.service';
import { ProactiveEventEngineService } from './services/proactive-event-engine.service';
import { NotificationOrchestratorService } from './services/notification-orchestrator.service';
import { NotificationDeduplicationService } from './services/notification-deduplication.service';
import { NotificationFeedbackService } from './services/notification-feedback.service';
import { NotificationAdaptationService } from './services/notification-adaptation.service';
import { NotificationDeliveryQueueService } from './services/notification-delivery-queue.service';
import { NotificationDeviceRegistryService } from './services/notification-device-registry.service';
import { InAppNotificationDeliveryProvider, NotificationDeliveryProviderRegistry } from './services/notification-delivery-provider.service';
import { NotificationDeliveryDispatcherService } from './services/notification-delivery-dispatcher.service';
import { PushTokenHealthService } from './services/push-token-health.service';
import { NotificationFeedbackAdapterService } from './services/notification-feedback-adapter.service';
import { AdaptiveNotificationDecisionService } from './services/adaptive-notification-decision.service';
import { NotificationChannelIntelligenceService } from './services/notification-channel-intelligence.service';
import { NotificationExperimentService } from './services/notification-experiment.service';
import { PersonalizationEngineService } from './services/personalization-engine.service';
import { PreferenceConflictResolverService } from './services/preference-conflict-resolver.service';
import { UnifiedDecisionEngineService } from './services/unified-decision-engine.service';
import { DecisionAuditService } from './services/decision-audit.service';
import { DecisionSafetyGuardService } from './services/decision-safety-guard.service';
import { DecisionExecutionPlannerService } from './services/decision-execution-planner.service';
import { DecisionReplanPolicyService } from './services/decision-replan-policy.service';
import { DecisionExecutionStateService } from './services/decision-execution-state.service';
import { DecisionFeedbackLoopService } from './services/decision-feedback-loop.service';
import { DecisionExplanationService } from './services/decision-explanation.service';
import { DecisionIdempotencyService } from './services/decision-idempotency.service';
import { DecisionRateLimiterService } from './services/decision-rate-limiter.service';
import { DecisionGuardrailService } from './services/decision-guardrail.service';

@Module({
  imports: [ConversationEngineModule, DailyModule, WorkoutModule, BrainIntegrationModule, ContextEngineModule, MemoryIntelligenceModule, UserIntelligenceModule],
  controllers: [PersonalBrainController],
  providers: [BrainStateService, BrainDecisionPipelineService, BrainDailyStatusService, BrainWeeklyStatusService, BrainNutritionTargetsService, BrainWorkoutStatusService, BrainLifeContextService, BrainMemoryContextService, RelevantMemoryContextService, BrainReasoningContextService, BrainReasoningEngineService, BrainOrchestratorService, MemoryManagerService, UserUnderstandingService, UserContextService, IntentionAnalysisService, ResponsePlanningService, SmartPlanningService, SchedulePolicyService, FullDaySchedulerService, DynamicReplanningService, ScheduleInsightsService, NextBestActionService, ScheduleConflictService, ProactiveNotificationPolicyService, DailyCapacityService, ScheduleExplanationService, ScheduleHealthService, ReplanPolicyService, ScheduleRecoveryService, ProactiveCoachService, CoachMessageService, ProactiveEventEngineService, NotificationOrchestratorService, NotificationDeduplicationService, NotificationFeedbackService, NotificationAdaptationService, NotificationDeliveryQueueService, NotificationDeviceRegistryService, InAppNotificationDeliveryProvider, NotificationDeliveryProviderRegistry, NotificationDeliveryDispatcherService, PushTokenHealthService, NotificationFeedbackAdapterService, AdaptiveNotificationDecisionService, NotificationChannelIntelligenceService, NotificationExperimentService, PersonalizationEngineService, PreferenceConflictResolverService, UnifiedDecisionEngineService, DecisionAuditService, DecisionSafetyGuardService, DecisionExecutionPlannerService, DecisionReplanPolicyService, DecisionExecutionStateService, DecisionFeedbackLoopService, DecisionExplanationService, DecisionIdempotencyService, DecisionRateLimiterService, DecisionGuardrailService],
  exports: [BrainStateService, BrainDecisionPipelineService, BrainMemoryContextService, BrainReasoningContextService, BrainReasoningEngineService, BrainOrchestratorService, BrainLifeContextService, SmartPlanningService, SchedulePolicyService, FullDaySchedulerService, DynamicReplanningService, ScheduleInsightsService, NextBestActionService, ScheduleConflictService, ProactiveNotificationPolicyService, DailyCapacityService, ScheduleExplanationService, ScheduleHealthService, ReplanPolicyService, ScheduleRecoveryService, ProactiveCoachService, CoachMessageService, ProactiveEventEngineService, NotificationOrchestratorService, NotificationDeduplicationService, NotificationFeedbackService, NotificationAdaptationService, NotificationDeliveryQueueService, NotificationDeviceRegistryService, NotificationDeliveryProviderRegistry, NotificationDeliveryDispatcherService, PushTokenHealthService, NotificationFeedbackAdapterService, AdaptiveNotificationDecisionService, NotificationChannelIntelligenceService, NotificationExperimentService, PersonalizationEngineService, PreferenceConflictResolverService, UnifiedDecisionEngineService, DecisionAuditService, DecisionSafetyGuardService, DecisionExecutionPlannerService, DecisionReplanPolicyService, DecisionExecutionStateService, DecisionFeedbackLoopService, DecisionExplanationService, DecisionIdempotencyService, DecisionRateLimiterService, DecisionGuardrailService],
})
export class PersonalBrainModule {}
