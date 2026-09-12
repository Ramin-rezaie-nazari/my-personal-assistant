import { Module } from '@nestjs/common';
import { AdaptiveLearningController } from './controllers/adaptive-learning.controller';
import { AdaptiveLearningService } from './services/adaptive-learning.service';

@Module({
  controllers: [AdaptiveLearningController],
  providers: [AdaptiveLearningService],
  exports: [AdaptiveLearningService],
})
export class AdaptiveLearningModule {}
