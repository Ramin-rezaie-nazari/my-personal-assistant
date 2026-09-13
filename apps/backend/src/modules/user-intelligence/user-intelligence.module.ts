import { Module } from '@nestjs/common';
import { UserIntelligenceController } from './controllers/user-intelligence.controller';
import { UserIntelligenceService } from './services/user-intelligence.service';
import { LearningService } from './services/learning.service';

@Module({
  controllers: [UserIntelligenceController],
  providers: [UserIntelligenceService, LearningService],
  exports: [UserIntelligenceService, LearningService],
})
export class UserIntelligenceModule {}
