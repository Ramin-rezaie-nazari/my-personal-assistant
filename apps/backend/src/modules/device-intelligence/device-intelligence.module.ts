import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/database/prisma.module';
import { DeviceIntelligenceController } from './controllers/device-intelligence.controller';
import { DeviceIntelligenceService } from './services/device-intelligence.service';
import { ActivityTrackingService } from './services/activity-tracking.service';
import { HealthSyncService } from './services/health-sync.service';

@Module({
  imports: [PrismaModule],
  controllers: [DeviceIntelligenceController],
  providers: [
    DeviceIntelligenceService,
    ActivityTrackingService,
    HealthSyncService,
  ],
  exports: [
    DeviceIntelligenceService,
    ActivityTrackingService,
    HealthSyncService,
  ],
})
export class DeviceIntelligenceModule {}
