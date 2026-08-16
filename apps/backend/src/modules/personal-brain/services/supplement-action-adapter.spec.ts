import { SupplementActionAdapter } from './supplement-action-adapter';

describe('SupplementActionAdapter', () => {
  it('marks the linked supplement as taken', async () => {
    const registry = { register: () => registry } as any;
    const supplements = {
      takeToday: jest.fn().mockResolvedValue({ taken: true }),
    } as any;
    const adapter = new SupplementActionAdapter(registry, supplements);
    await adapter.execute({ action: 'take_supplement' } as any, {
      userId: 'u1',
      input: 'همون مکمل رو خوردم',
      contextualState: { targetResourceId: 's1' },
    });
    expect(supplements.takeToday).toHaveBeenCalledWith('u1', 's1');
  });

  it('updates the linked supplement schedule without changing ownership', async () => {
    const registry = { register: () => registry } as any;
    const supplements = {
      updateSupplement: jest.fn().mockResolvedValue({ id: 's1' }),
    } as any;
    const adapter = new SupplementActionAdapter(registry, supplements);
    await adapter.execute({ action: 'update_supplement' } as any, {
      userId: 'u1',
      input: 'همون مکمل رو ساعت 21:30 کن',
      contextualState: { targetResourceId: 's1' },
    });
    expect(supplements.updateSupplement).toHaveBeenCalledWith('u1', 's1', {
      scheduledTime: '21:30',
    });
  });
});
