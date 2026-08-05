import { Injectable } from '@nestjs/common';

@Injectable()
export class DeviceIntelligenceService {
  async getHealthData() {
    await Promise.resolve();

    return {
      message: 'Device health data',
      steps: 0,
      caloriesBurned: 0,
      sleepHours: 0,
    };
  }
}
