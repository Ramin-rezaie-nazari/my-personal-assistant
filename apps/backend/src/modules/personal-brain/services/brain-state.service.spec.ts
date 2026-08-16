import { BrainStateService } from './brain-state.service';

describe('BrainStateService', () => {
  it('returns normalized life context for reasoning', async () => {
    const dailyStatus = { value: 'today' };
    const weeklyStatus = { value: 'week' };
    const nutritionTargets = { calories: 2200 };
    const workoutStatus = { sessions: 2 };
    const lifeContext = {
      reminders: { pending: 1 },
      habits: { active: 2 },
      supplements: { total: 3 },
    };

    const service = new BrainStateService(
      { getContext: jest.fn().mockResolvedValue({}) },
      {
        buildMemoryContext: jest
          .fn()
          .mockResolvedValue({ memories: [{ id: 'm1' }] }),
      } as any,
      { getGoals: jest.fn().mockResolvedValue([{ id: 'g1' }]) } as any,
      { getToday: jest.fn().mockResolvedValue(dailyStatus) } as any,
      { getThisWeek: jest.fn().mockResolvedValue(weeklyStatus) } as any,
      { getTargets: jest.fn().mockResolvedValue(nutritionTargets) } as any,
      { getThisWeek: jest.fn().mockResolvedValue(workoutStatus) } as any,
      { getToday: jest.fn().mockResolvedValue(lifeContext) } as any,
      { build: jest.fn().mockReturnValue({ user: 'ctx' }) },
      { buildContext: jest.fn().mockResolvedValue({}) } as any,
      {
        build: jest.fn().mockReturnValue({}),
      } as any,
    );

    const state = await service.buildState('hello', 'u1');
    expect(state.lifeContext).toBeDefined();
    expect(state.lifeContext?.habits.active).toBe(2);
    expect(state.lifeContext?.supplements.total).toBe(3);
  });
});
