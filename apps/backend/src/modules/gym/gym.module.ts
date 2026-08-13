import { Module } from '@nestjs/common';
import { GymLibraryService } from './services/gym-library.service';
import { GymSessionGeneratorService } from './services/gym-session-generator.service';

@Module({
  providers: [GymLibraryService, GymSessionGeneratorService],
  exports: [GymLibraryService, GymSessionGeneratorService],
})
export class GymModule {}
