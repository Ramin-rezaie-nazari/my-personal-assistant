import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BrainContextService } from '../services/brain-context.service';

@Controller('brain-integration')
@UseGuards(JwtAuthGuard)
export class BrainIntegrationController {
  constructor(private readonly brainContextService: BrainContextService) {}

  @Get('context')
  getContext(
    @Request() req: { user: { id: string } },
    @Query('dateKey') dateKey?: string,
  ) {
    return this.brainContextService.getContext(req.user.id, dateKey);
  }
}
