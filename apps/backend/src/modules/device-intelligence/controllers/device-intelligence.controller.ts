import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateDeviceSyncDto } from '../dto/create-device-sync.dto';
import { DeviceIntelligenceService } from '../services/device-intelligence.service';
import { HealthSyncService } from '../services/health-sync.service';

@Controller('device-intelligence')
@UseGuards(JwtAuthGuard)
export class DeviceIntelligenceController {
  constructor(
    private readonly deviceService: DeviceIntelligenceService,
    private readonly healthSync: HealthSyncService,
  ) {}

  @Get()
  getDeviceData(@Request() req: { user: { id: string } }, @Query('dateKey') dateKey?: string) {
    return this.deviceService.getHealthData(req.user.id, dateKey);
  }

  @Post('health-sync')
  syncHealthData(@Request() req: { user: { id: string } }, @Body() body: CreateDeviceSyncDto) {
    return this.healthSync.syncHealthData(req.user.id, body);
  }
}
