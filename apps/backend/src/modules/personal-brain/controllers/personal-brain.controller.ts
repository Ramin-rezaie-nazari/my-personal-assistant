import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateBrainRequestDto } from '../dto/create-brain-request.dto';
import { BrainOrchestratorService } from '../services/brain-orchestrator.service';
import { DynamicReplanningService } from '../services/dynamic-replanning.service';
import { FullDaySchedulerService } from '../services/full-day-scheduler.service';
import { NextBestActionService } from '../services/next-best-action.service';
import { ScheduleInsightsService } from '../services/schedule-insights.service';
import { ScheduleHealthService } from '../services/schedule-health.service';
import { ReplanPolicyService } from '../services/replan-policy.service';
import { SmartPlanningService } from '../services/smart-planning.service';

interface AuthenticatedRequest extends Request { user: { id: string } }

@Controller('personal-brain')
export class PersonalBrainController {
  constructor(
    private readonly brainOrchestratorService: BrainOrchestratorService,
    private readonly smartPlanningService: SmartPlanningService,
    private readonly fullDaySchedulerService: FullDaySchedulerService,
    private readonly dynamicReplanningService: DynamicReplanningService,
    private readonly scheduleInsightsService: ScheduleInsightsService,
    private readonly nextBestActionService: NextBestActionService,
    private readonly scheduleHealthService: ScheduleHealthService,
    private readonly replanPolicyService: ReplanPolicyService,
  ) {}

  @Get()
  getStatus() { return { module: 'personal-brain', status: 'ready' }; }

  @Get('plan')
  @UseGuards(JwtAuthGuard)
  async getPlan(@Req() req: AuthenticatedRequest) { return this.smartPlanningService.getPlan(req.user.id); }

  @Get('schedule/today')
  @UseGuards(JwtAuthGuard)
  async getTodaySchedule(@Req() req: AuthenticatedRequest) { return this.fullDaySchedulerService.buildDay(req.user.id); }

  @Get('schedule/replan')
  @UseGuards(JwtAuthGuard)
  async replan(@Req() req: AuthenticatedRequest) { return this.dynamicReplanningService.replanRemainingDay(req.user.id); }

  @Get('schedule/insights')
  @UseGuards(JwtAuthGuard)
  async getScheduleInsights(@Req() req: AuthenticatedRequest) { return this.scheduleInsightsService.getInsights(req.user.id); }

  @Get('schedule/health')
  @UseGuards(JwtAuthGuard)
  async getScheduleHealth(@Req() req: AuthenticatedRequest) { return this.scheduleHealthService.evaluate(req.user.id); }

  @Get('schedule/replan-decision')
  @UseGuards(JwtAuthGuard)
  async getReplanDecision(@Req() req: AuthenticatedRequest) { return this.replanPolicyService.decide(req.user.id); }

  @Get('next-action')
  @UseGuards(JwtAuthGuard)
  async getNextAction(@Req() req: AuthenticatedRequest) { return this.nextBestActionService.get(req.user.id); }

  @Post()
  @UseGuards(JwtAuthGuard)
  async process(@Body() dto: CreateBrainRequestDto, @Req() req: AuthenticatedRequest) { return this.brainOrchestratorService.processRequest(dto.message, req.user.id); }
}
