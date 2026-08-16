import { HabitActionAdapter } from './habit-action-adapter';

describe('HabitActionAdapter', () => {
  it('completes the linked habit in the current user scope', async () => {
    const registry = { register: () => registry } as any;
    const habits = {
      completeToday: jest.fn().mockResolvedValue({ id: 'h1' }),
    } as any;
    const adapter = new HabitActionAdapter(registry, habits);
    await adapter.execute({ action: 'complete_habit' } as any, {
      userId: 'u1',
      input: 'همین عادت رو انجام شده کن',
      contextualState: { targetResourceId: 'h1' },
    });
    expect(habits.completeToday).toHaveBeenCalledWith('u1', 'h1');
  });

  it('updates a linked weekly target', async () => {
    const registry = { register: () => registry } as any;
    const habits = {
      updateHabit: jest.fn().mockResolvedValue({ id: 'h1' }),
    } as any;
    const adapter = new HabitActionAdapter(registry, habits);
    await adapter.execute({ action: 'update_habit' } as any, {
      userId: 'u1',
      input: 'همون رو 4 بار در هفته کن',
      contextualState: { targetResourceId: 'h1' },
    });
    expect(habits.updateHabit).toHaveBeenCalledWith('u1', 'h1', {
      targetPerWeek: 4,
    });
  });
});
