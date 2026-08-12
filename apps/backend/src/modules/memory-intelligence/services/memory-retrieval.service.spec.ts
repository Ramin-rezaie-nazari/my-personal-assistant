import { MemoryRetrievalService } from './memory-retrieval.service';
import { MemoryRepository } from '../repositories/memory.repository';

const createRepositoryMock = (): jest.Mocked<MemoryRepository> => ({
  save: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findByKey: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn(),
});

describe('MemoryRetrievalService', () => {
  it('passes the authenticated user id to repository queries', async () => {
    const repository = createRepositoryMock();
    repository.getAll.mockResolvedValue([
      {
        id: 'memory-1',
        userId: 'user-123',
        type: 'knowledge' as never,
        key: 'favorite-food',
        value: 'pasta',
        importance: 0.8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const service = new MemoryRetrievalService(repository);

    const memories = await service.search('pasta', 'user-123');

    expect(repository.getAll).toHaveBeenCalledWith('user-123');
    expect(memories).toHaveLength(1);
  });

  it('passes the authenticated user id when retrieving by key', async () => {
    const repository = createRepositoryMock();
    repository.findByKey.mockResolvedValue(null);

    const service = new MemoryRetrievalService(repository);

    await service.retrieveByKey('favorite-food', 'user-123');

    expect(repository.findByKey).toHaveBeenCalledWith(
      'favorite-food',
      'user-123',
    );
  });
});
