import { Module } from '@nestjs/common';
import { DecisionEngineController } from './controllers/decision-engine.controller';
import { DecisionEngineService } from './services/decision-engine.service';
import { RuleEvaluationService } from './services/rule-evaluation.service';
import { DecisionScoringService } from './services/decision-scoring.service';

@Module({
  controllers: [DecisionEngineController],
  providers: [
    DecisionEngineService,
    RuleEvaluationService,
    DecisionScoringService,
  ],
  exports: [
    DecisionEngineService,
    RuleEvaluationService,
    DecisionScoringService,
  ],
})
export class DecisionEngineModule {}
