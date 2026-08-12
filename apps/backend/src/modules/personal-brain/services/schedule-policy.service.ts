import { Injectable } from '@nestjs/common';

type Adaptive = { bestHours?: number[]; preferredTaskMinutes?: number | null; snoozeRate?: number };

@Injectable()
export class SchedulePolicyService {
  getPolicy(adaptive: Adaptive) {
    const bestHours = (adaptive.bestHours ?? []).filter(h => Number.isFinite(h) && h >= 0 && h <= 23);
    const preferredTaskMinutes = Math.max(10, Math.min(180, adaptive.preferredTaskMinutes ?? 45));
    const snoozeRate = Math.max(0, Math.min(1, adaptive.snoozeRate ?? 0));
    const maxFocusedMinutes = snoozeRate >= 0.5 ? 180 : snoozeRate >= 0.3 ? 240 : 300;
    return { workingWindow: { startHour: 7, endHour: 22 }, focusWindow: bestHours.length ? { startHour: bestHours[0], endHour: Math.min(22, bestHours[0] + 2) } : { startHour: 9, endHour: 11 }, preferredTaskMinutes, maxFocusedMinutes, bufferMinutes: snoozeRate >= 0.4 ? 20 : 15, notificationLeadMinutes: snoozeRate >= 0.5 ? 5 : 10 };
  }
}
