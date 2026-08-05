import { Module } from '@nestjs/common';

import { GoalIntelligenceController } from './controllers/goal-intelligence.controller';

import { GoalAnalysisService } from './services/goal-analysis.service';
import { GoalPlanningService } from './services/goal-planning.service';
import { GoalProgressService } from './services/goal-progress.service';

@Module({
  controllers: [GoalIntelligenceController],
  providers: [GoalAnalysisService, GoalPlanningService, GoalProgressService],
  exports: [GoalAnalysisService, GoalPlanningService, GoalProgressService],
})
export class GoalIntelligenceModule {}
