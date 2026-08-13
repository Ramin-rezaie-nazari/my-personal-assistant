import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateBrainRequestDto } from '../dto/create-brain-request.dto';
import { BrainOrchestratorService } from '../services/brain-orchestrator.service';
import { BrainReasoningContextService } from '../services/brain-reasoning-context.service';
import { FitnessSessionOrchestratorService } from '../services/fitness-session-orchestrator.service';
import { FitnessSkillUnlockService } from '../services/fitness-skill-unlock.service';
import { WorkoutPerformanceMemoryService } from '../services/workout-performance-memory.service';
import { DynamicReplanningService } from '../services/dynamic-replanning.service';
import { FullDaySchedulerService } from '../services/full-day-scheduler.service';
import { NextBestActionService } from '../services/next-best-action.service';
import { ScheduleInsightsService } from '../services/schedule-insights.service';
import { ScheduleHealthService } from '../services/schedule-health.service';
import { ReplanPolicyService } from '../services/replan-policy.service';
import { ScheduleRecoveryService } from '../services/schedule-recovery.service';
import { SmartPlanningService } from '../services/smart-planning.service';
import { ProactiveCoachService } from '../services/proactive-coach.service';
import { CoachMessageService, SupportedLanguage } from '../services/coach-message.service';
import { ProactiveEventEngineService } from '../services/proactive-event-engine.service';
import { NotificationOrchestratorService, NotificationPreferences } from '../services/notification-orchestrator.service';
import { NotificationDeduplicationService } from '../services/notification-deduplication.service';
import { NotificationFeedbackService, NotificationAction } from '../services/notification-feedback.service';
import { NotificationDeviceRegistryService, NotificationPlatform } from '../services/notification-device-registry.service';
import { ScenarioPlanningService } from '../services/scenario-planning.service';
import { PersistentPlanStateService } from '../services/persistent-plan-state.service';
import { DecisionAuditService } from '../services/decision-audit.service';
import { DecisionCandidate } from '../services/unified-decision-engine.service';

interface AuthenticatedRequest extends Request { user: { id: string } }

@Controller('personal-brain')
export class PersonalBrainController {
  constructor(private readonly brainOrchestratorService: BrainOrchestratorService, private readonly brainReasoningContextService: BrainReasoningContextService, private readonly fitnessSessionOrchestratorService: FitnessSessionOrchestratorService, private readonly fitnessSkillUnlockService: FitnessSkillUnlockService, private readonly workoutPerformanceMemoryService: WorkoutPerformanceMemoryService, private readonly smartPlanningService: SmartPlanningService, private readonly fullDaySchedulerService: FullDaySchedulerService, private readonly dynamicReplanningService: DynamicReplanningService, private readonly scheduleInsightsService: ScheduleInsightsService, private readonly nextBestActionService: NextBestActionService, private readonly scheduleHealthService: ScheduleHealthService, private readonly replanPolicyService: ReplanPolicyService, private readonly scheduleRecoveryService: ScheduleRecoveryService, private readonly proactiveCoachService: ProactiveCoachService, private readonly coachMessageService: CoachMessageService, private readonly proactiveEventEngineService: ProactiveEventEngineService, private readonly notificationOrchestratorService: NotificationOrchestratorService, private readonly notificationDeduplicationService: NotificationDeduplicationService, private readonly notificationFeedbackService: NotificationFeedbackService, private readonly notificationDeviceRegistryService: NotificationDeviceRegistryService, private readonly scenarioPlanningService: ScenarioPlanningService, private readonly persistentPlanStateService: PersistentPlanStateService, private readonly decisionAuditService: DecisionAuditService) {}
  @Get() getStatus() { return { module: 'personal-brain', status: 'ready' }; }
  @Get('plan') @UseGuards(JwtAuthGuard) async getPlan(@Req() req: AuthenticatedRequest) { return this.smartPlanningService.getPlan(req.user.id); }
  @Get('plan/history') @UseGuards(JwtAuthGuard) async getPlanHistory(@Req() req: AuthenticatedRequest) { return this.persistentPlanStateService.listRecent(req.user.id, 10); }
  @Get('trace') @UseGuards(JwtAuthGuard) async getTrace(@Req() req: AuthenticatedRequest) { return this.decisionAuditService.recent(req.user.id, 20); }
  @Post('fitness/session') @UseGuards(JwtAuthGuard) async generateFitnessSession(@Body() body: { message?: string; durationMin?: number; level?: string; focus?: string }, @Req() req: AuthenticatedRequest) {
    const message = body.message?.trim() || 'I want a workout today';
    const context = await this.brainReasoningContextService.build(message, req.user.id);
    return this.fitnessSessionOrchestratorService.generate(context, { durationMin: Math.min(120, Math.max(5, Math.round(body.durationMin ?? 30))), level: body.level, focus: body.focus });
  }
  @Post('fitness/performance') @UseGuards(JwtAuthGuard) async recordFitnessPerformance(@Body() body: { discipline: string; exerciseId?: string; exerciseName?: string; sessionId?: string; workoutId?: string; formScore?: number; completionRate?: number; perceivedDifficulty?: number; recoveryScore?: number; reps?: number; sets?: number; durationSeconds?: number; loadKg?: number; metadata?: Record<string, unknown>; performedAt?: string }, @Req() req: AuthenticatedRequest) {
    return this.workoutPerformanceMemoryService.record({ ...body, userId: req.user.id, performedAt: body.performedAt ? new Date(body.performedAt) : undefined });
  }
  @Get('fitness/performance') @UseGuards(JwtAuthGuard) async getFitnessPerformance(@Req() req: AuthenticatedRequest) { return this.workoutPerformanceMemoryService.get(req.user.id, 28); }
  @Get('fitness/skills') @UseGuards(JwtAuthGuard) async getFitnessSkills(@Req() req: AuthenticatedRequest) { return this.fitnessSkillUnlockService.evaluateCalisthenicsSkills(req.user.id); }
  @Get('schedule/today') @UseGuards(JwtAuthGuard) async getTodaySchedule(@Req() req: AuthenticatedRequest) { return this.fullDaySchedulerService.buildDay(req.user.id); }
  @Get('schedule/replan') @UseGuards(JwtAuthGuard) async replan(@Req() req: AuthenticatedRequest) { return this.dynamicReplanningService.replanRemainingDay(req.user.id); }
  @Get('schedule/insights') @UseGuards(JwtAuthGuard) async getScheduleInsights(@Req() req: AuthenticatedRequest) { return this.scheduleInsightsService.getInsights(req.user.id); }
  @Get('schedule/health') @UseGuards(JwtAuthGuard) async getScheduleHealth(@Req() req: AuthenticatedRequest) { return this.scheduleHealthService.evaluate(req.user.id); }
  @Get('schedule/replan-decision') @UseGuards(JwtAuthGuard) async getReplanDecision(@Req() req: AuthenticatedRequest) { return this.replanPolicyService.decide(req.user.id); }
  @Get('schedule/recovery') @UseGuards(JwtAuthGuard) async getScheduleRecovery(@Req() req: AuthenticatedRequest) { return this.scheduleRecoveryService.analyze(req.user.id); }
  @Get('next-action') @UseGuards(JwtAuthGuard) async getNextAction(@Req() req: AuthenticatedRequest) { return this.nextBestActionService.get(req.user.id); }
  @Get('coach/next') @UseGuards(JwtAuthGuard) async getCoachNext(@Req() req: AuthenticatedRequest) { return this.proactiveCoachService.getNextCoach(req.user.id); }
  @Get('coach/message') @UseGuards(JwtAuthGuard) async getCoachMessage(@Req() req: AuthenticatedRequest) { const language = (req.query.language === 'fa' ? 'fa' : 'en') as SupportedLanguage; return this.coachMessageService.getMessage(req.user.id, language); }
  @Get('coach/events') @UseGuards(JwtAuthGuard) async getCoachEvents(@Req() req: AuthenticatedRequest) { return this.proactiveEventEngineService.buildEvents(req.user.id); }
  @Post('coach/notification-decision') @UseGuards(JwtAuthGuard) async getNotificationDecision(@Body() body: { event: any; preferences?: NotificationPreferences }, @Req() req: AuthenticatedRequest) { const duplicate = this.notificationDeduplicationService.shouldSend(body.event); if (!duplicate.allowed) return { send: false, event: body.event, reason: duplicate.reason }; return this.notificationOrchestratorService.decide(body.event, body.preferences); }
  @Post('coach/notification-feedback') @UseGuards(JwtAuthGuard) async recordNotificationFeedback(@Body() body: { dedupeKey: string; eventType: string; action: NotificationAction; snoozeUntil?: string }, @Req() req: AuthenticatedRequest) { return this.notificationFeedbackService.record({ userId: req.user.id, ...body }); }
  @Get('coach/notification-feedback') @UseGuards(JwtAuthGuard) async getNotificationFeedback(@Req() req: AuthenticatedRequest) { return this.notificationFeedbackService.getRecent(req.user.id); }
  @Get('coach/notification-signal') @UseGuards(JwtAuthGuard) async getNotificationSignal(@Req() req: AuthenticatedRequest) { return this.notificationFeedbackService.getSignal(req.user.id, String(req.query.eventType ?? 'next_action')); }
  @Post('coach/device') @UseGuards(JwtAuthGuard) async registerNotificationDevice(@Body() body: { platform: NotificationPlatform; pushToken: string; locale?: 'fa' | 'en'; timezone?: string }, @Req() req: AuthenticatedRequest) { return this.notificationDeviceRegistryService.register({ userId: req.user.id, ...body }); }
  @Get('coach/devices') @UseGuards(JwtAuthGuard) async listNotificationDevices(@Req() req: AuthenticatedRequest) { return this.notificationDeviceRegistryService.listEnabled(req.user.id); }
  @Post('coach/device/disable') @UseGuards(JwtAuthGuard) async disableNotificationDevice(@Body() body: { deviceId: string }, @Req() req: AuthenticatedRequest) { return this.notificationDeviceRegistryService.disable(body.deviceId); }
  @Post('scenario/compare') @UseGuards(JwtAuthGuard) async compareScenarios(@Body() body: { candidates: DecisionCandidate[]; baseline?: Record<string, number>; context?: { budgetPressure?: boolean; capacityPressure?: boolean; healthConstraint?: boolean } }) { return this.scenarioPlanningService.compare(body); }
  @Post() @UseGuards(JwtAuthGuard) async process(@Body() dto: CreateBrainRequestDto, @Req() req: AuthenticatedRequest) { return this.brainOrchestratorService.processRequest(dto.message, req.user.id); }
}
