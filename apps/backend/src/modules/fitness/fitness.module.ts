import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/database/prisma.module';
import { FitnessController } from './controllers/fitness.controller';
import { FitnessProfileService } from './services/fitness-profile.service';
import { FitnessProfilePersistenceService } from './services/fitness-profile-persistence.service';

@Module({
  imports: [PrismaModule],
  controllers: [FitnessController],
  providers: [
    FitnessProfilePersistenceService,
    {
      provide: FitnessProfileService,
      useExisting: FitnessProfilePersistenceService,
    },
  ],
  exports: [FitnessProfileService, FitnessProfilePersistenceService],
})
export class FitnessModule {}
