import { MemoryType } from '../models/memory.model';
import { MemoryIntelligenceController } from './memory-intelligence.controller';

describe('MemoryIntelligenceController', () => {
  const service = {
    remember: jest.fn(),
    getMemories: jest.fn(),
    recallByKey: jest.fn(),
    recall: jest.fn(),
    forget: jest.fn(),
  };

  let controller: MemoryIntelligenceController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new MemoryIntelligenceController(service as never);
  });

  it('uses the authenticated user id when creating memory', async () => {
    service.remember.mockResolvedValue(undefined);

    const result = await controller.remember(
      { user: { id: 'user-123' } },
      {
        type: MemoryType.PREFERENCE,
        key: 'favorite_food',
        value: 'pizza',
      },
    );

    expect(service.remember).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        key: 'favorite_food',
        value: 'pizza',
        importance: 0.5,
      }),
    );
    expect(result.userId).toBe('user-123');
  });

  it('always scopes reads to the authenticated user', async () => {
    const memories = [{ id: 'm1' }];
    service.getMemories.mockResolvedValue(memories);

    await expect(
      controller.getMemories({ user: { id: 'user-123' } }),
    ).resolves.toEqual(memories);

    expect(service.getMemories).toHaveBeenCalledWith('user-123');
  });

  it('scopes key lookup and delete to the authenticated user', async () => {
    service.recallByKey.mockResolvedValue(null);
    service.forget.mockResolvedValue(undefined);

    await controller.recallByKey({ user: { id: 'user-123' } }, 'favorite_food');
    await controller.forget({ user: { id: 'user-123' } }, 'memory-1');

    expect(service.recallByKey).toHaveBeenCalledWith(
      'favorite_food',
      'user-123',
    );
    expect(service.forget).toHaveBeenCalledWith('memory-1', 'user-123');
  });
});
