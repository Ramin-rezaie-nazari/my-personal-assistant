import { SchedulePolicyService } from './schedule-policy.service';

describe('SchedulePolicyService', () => {
  const service = new SchedulePolicyService();
  it('reduces focus load and increases buffers for high snooze users', () => {
    const policy = service.getPolicy({ bestHours: [10], preferredTaskMinutes: 60, snoozeRate: 0.65 });
    expect(policy.focusWindow).toEqual({ startHour: 10, endHour: 12 });
    expect(policy.maxFocusedMinutes).toBe(180);
    expect(policy.bufferMinutes).toBe(20);
    expect(policy.notificationLeadMinutes).toBe(5);
  });
  it('clamps unsafe adaptive values', () => {
    const policy = service.getPolicy({ bestHours: [-5, 99], preferredTaskMinutes: 999, snoozeRate: -1 });
    expect(policy.preferredTaskMinutes).toBe(180);
    expect(policy.snoozeRate).toBe(0);
    expect(policy.focusWindow).toEqual({ startHour: 9, endHour: 11 });
  });
});
