import { Module } from '@nestjs/common';
import { UserIntelligenceController } from './controllers/user-intelligence.controller';
import { UserIntelligenceService } from './services/user-intelligence.service';
import { UserProfileService } from './services/user-profile.service';
import { LearningService } from './services/learning.service';

@Module({
  controllers: [UserIntelligenceController],
  providers: [UserIntelligenceService, UserProfileService, LearningService],
  exports: [UserIntelligenceService, UserProfileService, LearningService],
})
export class UserIntelligenceModule {}
