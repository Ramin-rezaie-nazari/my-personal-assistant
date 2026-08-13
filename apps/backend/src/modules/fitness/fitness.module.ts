import { Module } from '@nestjs/common';
import { FitnessController } from './controllers/fitness.controller';
import { FitnessProfileService } from './services/fitness-profile.service';

@Module({
  controllers: [FitnessController],
  providers: [FitnessProfileService],
  exports: [FitnessProfileService],
})
export class FitnessModule {}
