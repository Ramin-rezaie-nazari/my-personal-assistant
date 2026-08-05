import { Module } from '@nestjs/common';
import { AdaptiveLearningController } from './controllers/adaptive-learning.controller';
import { AdaptiveLearningService } from './services/adaptive-learning.service';
import { LearningMemoryService } from './services/learning-memory.service';
import { FeedbackAnalysisService } from './services/feedback-analysis.service';

@Module({
  controllers: [AdaptiveLearningController],
  providers: [
    AdaptiveLearningService,
    LearningMemoryService,
    FeedbackAnalysisService,
  ],
  exports: [AdaptiveLearningService],
})
export class AdaptiveLearningModule {}
