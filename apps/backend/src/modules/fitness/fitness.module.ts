import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/database/prisma.module';
import { FitnessController } from './controllers/fitness.controller';
import { FitnessProfileService } from './services/fitness-profile.service';
import { FitnessProfilePersistenceService } from './services/fitness-profile-persistence.service';
import { ExerciseContentService } from './services/exercise-content.service';

@Module({
  imports: [PrismaModule],
  controllers: [FitnessController],
  providers: [
    FitnessProfilePersistenceService,
    ExerciseContentService,
    {
      provide: FitnessProfileService,
      useExisting: FitnessProfilePersistenceService,
    },
  ],
  exports: [FitnessProfileService, FitnessProfilePersistenceService, ExerciseContentService],
})
export class FitnessModule {}
