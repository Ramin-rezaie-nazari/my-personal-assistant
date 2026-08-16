import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NextBestActionService } from '../services/next-best-action.service';
import { DecisionExecutionCoordinatorService } from '../services/decision-execution-coordinator.service';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

type ConfirmationBody = { token: string };

@Controller('personal-brain/decision')
export class DecisionExecutionController {
  constructor(
    private readonly nextBestAction: NextBestActionService,
    private readonly coordinator: DecisionExecutionCoordinatorService,
  ) {}

  @Post('execute-next')
  @UseGuards(JwtAuthGuard)
  async executeNext(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    const next = await this.nextBestAction.get(userId);
    if (!next.execution?.candidate) {
      return { status: 'unsupported', reason: 'no_actionable_next_action' };
    }
    return this.coordinator.execute(userId, next.execution.candidate);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  async confirm(@Req() req: AuthenticatedRequest) {
    const body = req.body as ConfirmationBody;
    return this.coordinator.confirmAndExecute(req.user.id, body?.token ?? '');
  }
}
