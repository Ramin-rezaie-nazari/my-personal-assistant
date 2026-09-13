import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BrainContextService } from '../services/brain-context.service';

type AuthenticatedRequest = { user: { id: string } };

@Controller('brain-integration')
@UseGuards(JwtAuthGuard)
export class BrainIntegrationController {
  constructor(private readonly brainContextService: BrainContextService) {}

  @Get('context')
  getContext(@Request() req: AuthenticatedRequest) {
    return this.brainContextService.getContext(req.user.id);
  }
}
