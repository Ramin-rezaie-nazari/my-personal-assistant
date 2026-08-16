import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ActionDecisionService } from '../services/action-decision.service';

@Controller('decision-engine')
@UseGuards(JwtAuthGuard)
export class DecisionEngineController {
  constructor(private readonly actionDecision: ActionDecisionService) {}

  @Get()
  evaluate(
    @Request() req: { user: { id: string } },
    @Query('dateKey') dateKey?: string,
  ) {
    return this.actionDecision.generate(req.user.id, dateKey);
  }
}
