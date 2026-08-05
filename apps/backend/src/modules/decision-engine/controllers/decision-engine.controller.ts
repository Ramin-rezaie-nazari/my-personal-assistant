import { Controller, Get } from '@nestjs/common';
import { DecisionEngineService } from '../services/decision-engine.service';

@Controller('decision-engine')
export class DecisionEngineController {
  constructor(private readonly decisionService: DecisionEngineService) {}

  @Get()
  evaluate() {
    return this.decisionService.makeDecision();
  }
}
