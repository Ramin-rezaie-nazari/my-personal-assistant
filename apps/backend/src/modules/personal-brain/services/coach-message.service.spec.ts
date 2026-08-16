import { CoachMessageService } from './coach-message.service';

describe('CoachMessageService', () => {
  it('returns Persian copy for a critical coach action', async () => {
    const coach = {
      getNextCoach: jest.fn().mockResolvedValue({
        primary: {
          type: 'start_task',
          priority: 'critical',
          title: 'Urgent',
          message: 'fallback',
          reason: 'overdue scheduled item',
        },
        alternatives: [],
        context: {},
      }),
    };
    const service = new CoachMessageService(coach as any);
    const result = await service.getMessage('u1', 'fa');
    expect(result.language).toBe('fa');
    expect(result.message).toContain('این کار');
  });
});
