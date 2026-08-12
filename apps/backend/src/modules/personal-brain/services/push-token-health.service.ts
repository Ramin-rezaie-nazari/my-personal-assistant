import { Injectable } from '@nestjs/common';
import { NotificationDeviceRegistryService } from './notification-device-registry.service';

export type PushTokenHealthResult = { valid: boolean; action: 'keep' | 'disable_device' | 'retry'; reason: string };

@Injectable()
export class PushTokenHealthService {
  constructor(private readonly devices: NotificationDeviceRegistryService) {}

  handleProviderError(deviceId: string, errorCode: string): PushTokenHealthResult {
    const permanent = ['DeviceNotRegistered', 'InvalidRegistration', 'Unregistered', 'TokenNotFound'].includes(errorCode);
    if (permanent) {
      const device = this.devices.disable(deviceId);
      return { valid: false, action: device ? 'disable_device' : 'retry', reason: `Provider reported permanent token error: ${errorCode}` };
    }
    return { valid: true, action: 'retry', reason: `Provider error may be temporary: ${errorCode}` };
  }
}
