import { Module } from '@nestjs/common';
import { CalisthenicsController } from './controllers/calisthenics.controller';
import { CalisthenicsLibraryService } from './services/calisthenics-library.service';
import { CalisthenicsSessionGeneratorService } from './services/calisthenics-session-generator.service';
import { CalisthenicsCoachService } from './services/calisthenics-coach.service';

@Module({
  controllers: [CalisthenicsController],
  providers: [CalisthenicsLibraryService, CalisthenicsSessionGeneratorService, CalisthenicsCoachService],
  exports: [CalisthenicsLibraryService, CalisthenicsSessionGeneratorService, CalisthenicsCoachService],
})
export class CalisthenicsModule {}
