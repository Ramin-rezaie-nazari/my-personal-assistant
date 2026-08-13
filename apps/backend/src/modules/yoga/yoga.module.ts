import { Module } from '@nestjs/common';
import { YogaController } from './controllers/yoga.controller';
import { YogaCoachService } from './services/yoga-coach.service';
import { YogaLibraryService } from './services/yoga-library.service';
import { YogaSessionGeneratorService } from './services/yoga-session-generator.service';

@Module({
  controllers: [YogaController],
  providers: [YogaLibraryService, YogaSessionGeneratorService, YogaCoachService],
  exports: [YogaLibraryService, YogaSessionGeneratorService, YogaCoachService],
})
export class YogaModule {}
