import { Injectable } from '@nestjs/common';

@Injectable()
export class ActivityTrackingService {
  async trackActivity() {
    await Promise.resolve();

    return {
      message: 'Activity tracked',
    };
  }
}
