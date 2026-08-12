import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdaptiveLearningService } from '../services/adaptive-learning.service';

@Controller('adaptive-learning')
@UseGuards(JwtAuthGuard)
export class AdaptiveLearningController {
  constructor(
    private readonly adaptiveLearningService: AdaptiveLearningService,
  ) {}

  @Get()
  getLearningStatus(@Request() req: { user: { id: string } }) {
    return this.adaptiveLearningService.getStatus(req.user.id);
  }

  @Get('insights')
  getInsights(
    @Request() req: { user: { id: string } },
    @Query('dateKey') dateKey?: string,
  ) {
    return this.adaptiveLearningService.getInsights(req.user.id, dateKey);
  }
}
