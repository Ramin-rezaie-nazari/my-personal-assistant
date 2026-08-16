import { BadRequestException } from '@nestjs/common';

import { PrismaMemoryRepository } from './prisma-memory.repository';
import { MemoryType } from '../models/memory.model';

describe('PrismaMemoryRepository', () => {
  const createMockPrisma = () => ({
    userFact: {
      create: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  });

  const makeMemory = () => ({
    id: 'memory-1',
    userId: 'user-1',
    type: MemoryType.PREFERENCE,
    key: 'favorite_food',
    value: 'pizza',
    importance: 0.75,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });

  it('persists user ownership and normalizes importance', async () => {
    const prisma = createMockPrisma();
    const repository = new PrismaMemoryRepository(prisma as never);

    await repository.save(makeMemory());

    expect(prisma.userFact.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'memory-1',
        userId: 'user-1',
        key: 'favorite_food',
        value: JSON.stringify('pizza'),
        importance: 75,
        source: 'brain-memory',
      }),
    });
  });

  it('scopes reads to the authenticated user', async () => {
    const prisma = createMockPrisma();
    prisma.userFact.findFirst.mockResolvedValue(null);
    const repository = new PrismaMemoryRepository(prisma as never);

    await repository.findById('memory-1', 'user-1');

    expect(prisma.userFact.findFirst).toHaveBeenCalledWith({
      where: { id: 'memory-1', userId: 'user-1', source: 'brain-memory' },
    });
  });

  it('rejects persistent operations without a user id', async () => {
    const prisma = createMockPrisma();
    const repository = new PrismaMemoryRepository(prisma as never);

    await expect(repository.getAll()).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.userFact.findMany).not.toHaveBeenCalled();
  });

  it('hydrates persisted values and importance back into the Memory contract', async () => {
    const prisma = createMockPrisma();
    prisma.userFact.findFirst.mockResolvedValue({
      id: 'memory-1',
      userId: 'user-1',
      category: MemoryType.PREFERENCE,
      key: 'favorite_food',
      value: JSON.stringify({ food: 'pizza' }),
      importance: 80,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    const repository = new PrismaMemoryRepository(prisma as never);

    await expect(
      repository.findByKey('favorite_food', 'user-1'),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'memory-1',
        userId: 'user-1',
        value: { food: 'pizza' },
        importance: 0.8,
      }),
    );
  });
});
