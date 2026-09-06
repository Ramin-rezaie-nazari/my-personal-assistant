import { Module } from '@nestjs/common';
import { CalisthenicsModule } from '../calisthenics/calisthenics.module';
import { GymModule } from '../gym/gym.module';
import { YogaModule } from '../yoga/yoga.module';
import { PrismaModule } from '../../common/database/prisma.module';
import { FitnessController } from './controllers/fitness.controller';
import { FitnessProfileService } from './services/fitness-profile.service';
import { FitnessProfilePersistenceService } from './services/fitness-profile-persistence.service';
import { FitnessCatalogService } from './services/fitness-catalog.service';
import { FitnessProgressService } from './services/fitness-progress.service';

@Module({
  imports: [PrismaModule, GymModule, CalisthenicsModule, YogaModule],
  controllers: [FitnessController],
  providers: [
    FitnessProfilePersistenceService,
    FitnessCatalogService,
    FitnessProgressService,
    {
      provide: FitnessProfileService,
      useExisting: FitnessProfilePersistenceService,
    },
  ],
  exports: [FitnessProfileService, FitnessProfilePersistenceService, FitnessCatalogService, FitnessProgressService],
})
export class FitnessModule {}
