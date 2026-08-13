import { BrainStateService } from './brain-state.service';

describe('BrainStateService', () => {
  it('returns normalized state for reasoning', async () => {
    const dailyStatus = { value: 'today' };
    const weeklyStatus = { value: 'week' };
    const nutritionTargets = { calories: 2200 };
    const workoutStatus = { sessions: 2 };
    const lifeContext = { habits: { active: 2 }, reminders: { pending: 1 }, supplements: { total: 3 } };
    const memoryContext = { memories: [{ id: 'm1' }] };
    const goals = [{ id: 'g1' }];

    const service = new BrainStateService(
      { buildMemoryContext: jest.fn().mockResolvedValue(memoryContext) } as any,
      { getGoals: jest.fn().mockResolvedValue(goals) } as any,
      { getToday: jest.fn().mockResolvedValue(dailyStatus) } as any,
      { getThisWeek: jest.fn().mockResolvedValue(weeklyStatus) } as any,
      { getTargets: jest.fn().mockResolvedValue(nutritionTargets) } as any,
      { getThisWeek: jest.fn().mockResolvedValue(workoutStatus) } as any,
      { getToday: jest.fn().mockResolvedValue(lifeContext) } as any,
      { build: jest.fn().mockReturnValue({ user: 'ctx' }) } as any,
    );

    const state = await service.buildState('hello', 'u1');
    expect(state.userContext).toEqual({ user: 'ctx' });
    expect(state.context.source).toBe('brain-state');
    expect(state.memories).toEqual(memoryContext.memories);
    expect(state.goals).toEqual(goals);
    expect(state.dailyStatus).toEqual(dailyStatus);
    expect(state.weeklyStatus).toEqual(weeklyStatus);
    expect(state.nutritionTargets).toEqual(nutritionTargets);
    expect(state.workoutStatus).toEqual(workoutStatus);
    expect(state.lifeContext).toEqual(lifeContext);
  });
});
