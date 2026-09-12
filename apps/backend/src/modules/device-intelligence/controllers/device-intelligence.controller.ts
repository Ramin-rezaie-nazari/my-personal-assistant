import { Controller, Get, UseGuards } from '@nestjs/common';
import { DeviceIntelligenceService } from '../services/device-intelligence.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('device-intelligence')
@UseGuards(JwtAuthGuard)
export class DeviceIntelligenceController {
  constructor(private readonly deviceService: DeviceIntelligenceService) {}

  @Get()
  getDeviceData() {
    return this.deviceService.getHealthData();
  }
}
