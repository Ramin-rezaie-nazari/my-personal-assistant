import { Controller, Get } from '@nestjs/common';
import { AdaptiveLearningService } from '../services/adaptive-learning.service';

@Controller('adaptive-learning')
export class AdaptiveLearningController {
  constructor(
    private readonly adaptiveLearningService: AdaptiveLearningService,
  ) {}

  @Get()
  getLearningStatus() {
    return this.adaptiveLearningService.getStatus();
  }
}
