import { Injectable } from '@nestjs/common';

export type NotificationPlatform = 'ios' | 'android' | 'web';
export type NotificationDevice = {
  id: string;
  userId: string;
  platform: NotificationPlatform;
  pushToken: string;
  enabled: boolean;
  locale?: 'fa' | 'en';
  timezone?: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class NotificationDeviceRegistryService {
  private readonly devices = new Map<string, NotificationDevice>();
  private sequence = 0;

  register(
    input: {
      userId: string;
      platform: NotificationPlatform;
      pushToken: string;
      locale?: 'fa' | 'en';
      timezone?: string;
    },
    now = new Date(),
  ) {
    const existing = [...this.devices.values()].find(
      (d) => d.userId === input.userId && d.pushToken === input.pushToken,
    );
    if (existing) {
      existing.enabled = true;
      existing.locale = input.locale ?? existing.locale;
      existing.timezone = input.timezone ?? existing.timezone;
      existing.lastSeenAt = now.toISOString();
      existing.updatedAt = now.toISOString();
      return existing;
    }
    const id = `device-${++this.sequence}`;
    const device: NotificationDevice = {
      id,
      ...input,
      enabled: true,
      lastSeenAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.devices.set(id, device);
    return device;
  }

  disable(id: string, now = new Date()) {
    const device = this.devices.get(id);
    if (!device) return null;
    device.enabled = false;
    device.updatedAt = now.toISOString();
    return device;
  }
  enable(id: string, now = new Date()) {
    const device = this.devices.get(id);
    if (!device) return null;
    device.enabled = true;
    device.lastSeenAt = now.toISOString();
    device.updatedAt = now.toISOString();
    return device;
  }
  remove(id: string) {
    return this.devices.delete(id);
  }
  listEnabled(userId: string) {
    return [...this.devices.values()].filter(
      (d) => d.userId === userId && d.enabled,
    );
  }
  get(id: string) {
    return this.devices.get(id);
  }
}
