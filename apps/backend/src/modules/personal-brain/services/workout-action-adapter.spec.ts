import { WorkoutActionAdapter } from './workout-action-adapter';

describe('WorkoutActionAdapter', () => {
  it('updates only linked workout fields supplied by the user', async () => {
    const registry = { register: () => registry } as any;
    const workouts = {
      updateWorkout: jest.fn().mockResolvedValue({ id: 'w1' }),
    } as any;
    const adapter = new WorkoutActionAdapter(registry, workouts);

    await adapter.execute({ action: 'update_workout' } as any, {
      userId: 'u1',
      input: 'همون تمرین رو 60 دقیقه کن',
      contextualState: { targetResourceId: 'w1' },
    });

    expect(workouts.updateWorkout).toHaveBeenCalledWith('u1', 'w1', {
      durationMinutes: 60,
    });
  });

  it('keeps delete ownership scoped', async () => {
    const registry = { register: () => registry } as any;
    const workouts = {
      deleteWorkout: jest.fn().mockResolvedValue({ deleted: true }),
    } as any;
    const adapter = new WorkoutActionAdapter(registry, workouts);
    await adapter.execute({ action: 'delete_workout' } as any, {
      userId: 'u1',
      input: 'حذفش کن',
      contextualState: { targetResourceId: 'w2' },
    });
    expect(workouts.deleteWorkout).toHaveBeenCalledWith('u1', 'w2');
  });
});
