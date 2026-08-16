import { NotificationOrchestratorService } from './notification-orchestrator.service';

describe('NotificationOrchestratorService', () => {
  const policy = {
    decide: jest
      .fn()
      .mockReturnValue({ notify: true, reason: 'inside notification window' }),
  };
  const service = new NotificationOrchestratorService(policy as any);

  it('suppresses normal notifications during overnight quiet hours', () => {
    const now = new Date('2026-08-12T23:00:00');
    const event: any = {
      priority: 'normal',
      scheduledFor: now.toISOString(),
      title: 'Task',
      body: 'Do it',
    };
    const result = service.decide(
      event,
      { quietHoursStart: '22:00', quietHoursEnd: '08:00' },
      now,
    );
    expect(result.send).toBe(false);
    expect(result.reason).toBe('quiet hours');
  });

  it('allows critical events through quiet hours', () => {
    const now = new Date('2026-08-12T23:00:00');
    const event: any = {
      priority: 'critical',
      scheduledFor: now.toISOString(),
      title: 'Critical',
      body: 'Now',
    };
    const result = service.decide(
      event,
      { quietHoursStart: '22:00', quietHoursEnd: '08:00' },
      now,
    );
    expect(result.send).toBe(true);
  });

  it('respects minimum priority', () => {
    const now = new Date('2026-08-12T10:00:00');
    const event: any = {
      priority: 'normal',
      scheduledFor: now.toISOString(),
      title: 'Normal',
      body: 'Later',
    };
    const result = service.decide(event, { minimumPriority: 'high' }, now);
    expect(result.send).toBe(false);
  });
});
