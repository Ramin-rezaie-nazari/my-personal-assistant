import { ProactiveCoachService } from './proactive-coach.service';

describe('ProactiveCoachService', () => {
  const explanation = { fromCoachAction: jest.fn().mockReturnValue({ summary: 'why', details: 'because', confidence: 0.9 }) };

  it('prioritizes overdue work over normal planning', async () => {
    const recovery = { analyze: jest.fn().mockResolvedValue({ overdue: [{ id: 't1', title: 'Urgent task' }], actions: [], requiresRecovery: true }) };
    const health = { evaluate: jest.fn().mockResolvedValue({ status: 'healthy', capacity: { utilization: 50, remainingMinutes: 120 } }) };
    const planner = { getPlan: jest.fn().mockResolvedValue({ bestAction: { id: 't2', title: 'Normal task', reasons: ['priority'] } }) };
    const service = new ProactiveCoachService(recovery as any, health as any, planner as any, explanation as any);
    const result = await service.getNextCoach('u1', new Date('2026-08-12T10:00:00Z'));
    expect(result.primary.type).toBe('start_task');
    expect(result.primary.priority).toBe('critical');
    expect(result.primary.taskId).toBe('t1');
  });

  it('recommends recovery for an overloaded day', async () => {
    const recovery = { analyze: jest.fn().mockResolvedValue({ overdue: [], actions: [{ type: 'rebuild_schedule' }], requiresRecovery: true }) };
    const health = { evaluate: jest.fn().mockResolvedValue({ status: 'overloaded', capacity: { utilization: 125, remainingMinutes: 0 } }) };
    const planner = { getPlan: jest.fn().mockResolvedValue({ bestAction: null }) };
    const service = new ProactiveCoachService(recovery as any, health as any, planner as any, explanation as any);
    const result = await service.getNextCoach('u1');
    expect(result.primary.type).toBe('recover_schedule');
    expect(result.primary.priority).toBe('high');
  });
});
