import { Module } from '@nestjs/common';
import { PersonalBrainModule } from '../personal-brain/personal-brain.module';
import { DecisionEngineController } from './controllers/decision-engine.controller';
import { DecisionEngineService } from './services/decision-engine.service';
import { ActionDecisionService } from './services/action-decision.service';
import { RuleEvaluationService } from './services/rule-evaluation.service';
import { DecisionScoringService } from './services/decision-scoring.service';

@Module({
  imports: [PersonalBrainModule],
  controllers: [DecisionEngineController],
  providers: [DecisionEngineService, ActionDecisionService, RuleEvaluationService, DecisionScoringService],
  exports: [DecisionEngineService, ActionDecisionService, RuleEvaluationService, DecisionScoringService],
})
export class DecisionEngineModule {}
