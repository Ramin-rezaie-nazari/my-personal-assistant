import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DeviceIntelligenceService } from '../services/device-intelligence.service';

@Controller('device-intelligence')
@UseGuards(JwtAuthGuard)
export class DeviceIntelligenceController {
  constructor(private readonly deviceService: DeviceIntelligenceService) {}

  @Get()
  getDeviceData() {
    return this.deviceService.getHealthData();
  }
}
