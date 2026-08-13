import { PersistentPlanStateService } from './persistent-plan-state.service';

describe('PersistentPlanStateService', () => {
  it('persists and resumes a running plan without losing completed steps', async () => {
    const records = new Map<string, any>();
    const prisma = {
      planExecutionState: {
        upsert: jest.fn(async ({ create, update }: any) => {
          const value = { ...(records.get('u1:p1') ?? {}), ...(records.size ? update : create), userId: 'u1', planId: 'p1', updatedAt: new Date() };
          records.set('u1:p1', value);
          return value;
        }),
        findUnique: jest.fn(async () => records.get('u1:p1') ?? null),
        deleteMany: jest.fn(async () => undefined),
      },
    } as any;

    const service = new PersistentPlanStateService(prisma);
    await service.save({
      userId: 'u1', planId: 'p1', status: 'running', stepIds: ['a', 'b'], completed: ['a'], blocked: [], failed: [], currentStep: 'b', updatedAt: new Date(),
    });

    const resumed = await service.resume('u1', 'p1');
    expect(resumed?.status).toBe('partial');
    expect(resumed?.completed).toEqual(['a']);
    expect(resumed?.currentStep).toBe('b');
  });

  it('scopes state by user and plan id', async () => {
    const service = new PersistentPlanStateService({
      planExecutionState: {
        upsert: jest.fn(async ({ create }: any) => create),
        findUnique: jest.fn(async ({ where }: any) => where.userId_planId.userId === 'u1' ? { userId: 'u1', planId: 'p1', status: 'completed', stepIds: ['a'], completed: ['a'], blocked: [], failed: [], currentStep: null, updatedAt: new Date() } : null),
        deleteMany: jest.fn(),
      },
    } as any);

    expect((await service.get('u1', 'p1'))?.planId).toBe('p1');
    expect(await service.get('u2', 'p1')).toBeNull();
  });
});
