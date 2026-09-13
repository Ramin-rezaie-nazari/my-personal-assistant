import { Module } from '@nestjs/common';
import { PersonalBrainModule } from '../personal-brain/personal-brain.module';
import { DecisionEngineController } from './controllers/decision-engine.controller';
import { ActionDecisionService } from './services/action-decision.service';
import { RuleEvaluationService } from './services/rule-evaluation.service';
import { DecisionScoringService } from './services/decision-scoring.service';

@Module({
  imports: [PersonalBrainModule],
  controllers: [DecisionEngineController],
  providers: [ActionDecisionService, RuleEvaluationService, DecisionScoringService],
  exports: [ActionDecisionService, RuleEvaluationService, DecisionScoringService],
})
export class DecisionEngineModule {}
