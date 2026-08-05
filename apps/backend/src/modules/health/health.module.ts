import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { HealthController } from './controllers/health.controller';
import { HealthService } from './services/health.service';
import { NutritionService } from './services/nutrition.service';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [HealthService, NutritionService],
})
export class HealthModule {}
