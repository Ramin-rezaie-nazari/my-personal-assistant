import { WorkoutActionAdapter } from './workout-action-adapter';

describe('WorkoutActionAdapter', () => {
  it('updates only linked workout fields supplied by the user', async () => {
    const registry = { register: () => registry } as any;
    const workouts = {
      updateWorkout: jest.fn().mockResolvedValue({ id: 'w1' }),
    } as any;
    const adapter = new WorkoutActionAdapter(registry, workouts, {} as any, {} as any);

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
    const adapter = new WorkoutActionAdapter(registry, workouts, {} as any, {} as any);
    await adapter.execute({ action: 'delete_workout' } as any, {
      userId: 'u1',
      input: 'حذفش کن',
      contextualState: { targetResourceId: 'w2' },
    });
    expect(workouts.deleteWorkout).toHaveBeenCalledWith('u1', 'w2');
  });

  it('returns exercises targeted to every requested area', async () => {
    const registry = { register: () => registry } as any;
    const workouts = {} as any;
    const catalog = {
      list: jest.fn()
        .mockResolvedValueOnce({
          items: [
            { id: 's1', name: 'Dumbbell Shoulder Press', focus: ['shoulders', 'deltoids'], difficultyLevel: 3, equipment: ['dumbbells'] },
            { id: 'x1', name: 'Bench Press', focus: ['chest'], difficultyLevel: 2, equipment: ['dumbbells'] },
          ],
          hasNextPage: false,
        })
        .mockResolvedValueOnce({
          items: [
            { id: 'b1', name: 'Lat Pulldown', focus: ['back', 'lats'], difficultyLevel: 4, equipment: ['cable_machine'] },
          ],
          hasNextPage: false,
        }),
    };
    const profile = {
      get: jest.fn().mockResolvedValue({ disciplines: ['gym'], equipment: [] }),
    };
    const adapter = new WorkoutActionAdapter(registry, workouts, catalog as any, profile as any);

    const result = await adapter.execute({ action: 'recommend_workout' } as any, {
      userId: 'u1',
      input: 'تمرین سرشانه و پشت میخوام',
      contextualState: {
        localUnderstanding: {
          entities: { targetAreas: ['shoulders', 'back'], targetArea: 'shoulders', discipline: 'gym' },
        },
      },
    });

    expect(result.targetAreas).toEqual(['shoulders', 'back']);
    expect(result.items.map((item: any) => item.id)).toEqual(['s1', 'b1']);
  });
});
