import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { HealthController } from './controllers/health.controller';
import { SystemHealthController } from './controllers/system-health.controller';
import { HealthService } from './services/health.service';
import { SystemHealthService } from './services/system-health.service';
import { NutritionService } from './services/nutrition.service';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController, SystemHealthController],
  providers: [HealthService, SystemHealthService, NutritionService],
})
export class HealthModule {}
