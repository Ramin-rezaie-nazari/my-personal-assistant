import { ProactiveEventEngineService } from './proactive-event-engine.service';

describe('ProactiveEventEngineService', () => {
  it('creates an immediate overdue event', async () => {
    const coach = {
      getNextCoach: jest.fn().mockResolvedValue({
        primary: {
          type: 'start_task',
          priority: 'critical',
          title: 'Pay bill',
          message: 'Start now',
          taskId: 't1',
          reason: 'overdue scheduled item',
        },
      }),
    };
    const quality = {
      evaluate: jest.fn().mockReturnValue({
        score: 0.9,
        confidence: 0.9,
        shouldNotify: true,
        reason: 'high expected user value',
      }),
    };
    const service = new ProactiveEventEngineService(
      coach as any,
      quality as any,
    );
    const now = new Date('2026-08-12T10:00:00Z');
    const events = await service.buildEvents('u1', now);
    expect(events[0]).toMatchObject({
      type: 'overdue_task',
      priority: 'critical',
      taskId: 't1',
    });
    expect(events[0].scheduledFor).toBe(now.toISOString());
  });

  it('creates a recovery event when the coach requests recovery', async () => {
    const coach = {
      getNextCoach: jest.fn().mockResolvedValue({
        primary: {
          type: 'recover_schedule',
          priority: 'high',
          title: 'Recover',
          message: 'Replan',
          reason: 'capacity exceeded',
        },
      }),
    };
    const quality = {
      evaluate: jest.fn().mockReturnValue({
        score: 0.85,
        confidence: 0.85,
        shouldNotify: true,
        reason: 'high expected user value',
      }),
    };
    const service = new ProactiveEventEngineService(
      coach as any,
      quality as any,
    );
    const events = await service.buildEvents(
      'u1',
      new Date('2026-08-12T10:00:00Z'),
    );
    expect(events[0].type).toBe('schedule_recovery');
  });

  it('suppresses low-value proactive events', async () => {
    const coach = {
      getNextCoach: jest.fn().mockResolvedValue({
        primary: {
          type: 'review_plan',
          priority: 'low',
          title: 'Clear day',
          message: 'Nothing urgent',
          reason: 'no urgent intervention required',
        },
      }),
    };
    const quality = {
      evaluate: jest.fn().mockReturnValue({
        score: 0.3,
        confidence: 0.4,
        shouldNotify: false,
        reason: 'insufficient value for an interruption',
      }),
    };
    const service = new ProactiveEventEngineService(
      coach as any,
      quality as any,
    );
    await expect(service.buildEvents('u1')).resolves.toEqual([]);
  });

  it('allows critical events even when quality is below the normal threshold', async () => {
    const coach = {
      getNextCoach: jest.fn().mockResolvedValue({
        primary: {
          type: 'start_task',
          priority: 'critical',
          title: 'Critical task',
          message: 'Act now',
          taskId: 't2',
          reason: 'overdue scheduled item',
        },
      }),
    };
    const quality = {
      evaluate: jest.fn().mockReturnValue({
        score: 0.5,
        confidence: 0.5,
        shouldNotify: false,
        reason: 'confidence too low for proactive delivery',
      }),
    };
    const service = new ProactiveEventEngineService(
      coach as any,
      quality as any,
    );
    const events = await service.buildEvents(
      'u1',
      new Date('2026-08-13T07:00:00Z'),
    );
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'overdue_task',
      priority: 'critical',
      taskId: 't2',
    });
  });
});
