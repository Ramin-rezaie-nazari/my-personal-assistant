import { Injectable } from '@nestjs/common';

@Injectable()
export class DailyCapacityService {
  estimate(input: { taskMinutes: number; maxFocusedMinutes: number; itemCount: number; unscheduledCount: number }) {
    const utilization = Math.min(150, Math.round((input.taskMinutes / Math.max(1, input.maxFocusedMinutes)) * 100));
    const status = utilization >= 120 ? 'overloaded' : utilization >= 90 ? 'full' : utilization >= 70 ? 'healthy' : 'light';
    const spareMinutes = Math.max(0, input.maxFocusedMinutes - input.taskMinutes);
    return { status, utilization, spareMinutes, overloaded: status === 'overloaded', canAcceptNewTask: status === 'light' || status === 'healthy', unscheduledCount: input.unscheduledCount, itemCount: input.itemCount };
  }
}
