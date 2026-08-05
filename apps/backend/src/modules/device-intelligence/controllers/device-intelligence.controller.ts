import { Controller, Get } from '@nestjs/common';
import { DeviceIntelligenceService } from '../services/device-intelligence.service';

@Controller('device-intelligence')
export class DeviceIntelligenceController {
  constructor(private readonly deviceService: DeviceIntelligenceService) {}

  @Get()
  getDeviceData() {
    return this.deviceService.getHealthData();
  }
}
