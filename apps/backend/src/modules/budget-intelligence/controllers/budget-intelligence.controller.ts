import { Controller, Get } from '@nestjs/common';
import { BudgetIntelligenceService } from '../services/budget-intelligence.service';

@Controller('budget-intelligence')
export class BudgetIntelligenceController {
  constructor(private readonly budgetService: BudgetIntelligenceService) {}

  @Get()
  getPlan() {
    return this.budgetService.createPlan();
  }
}
