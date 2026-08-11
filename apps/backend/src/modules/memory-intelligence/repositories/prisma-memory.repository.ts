import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service';
import { Memory, MemoryType } from '../models/memory.model';
import { MemoryRepository } from './memory.repository';

/**
 * Persistent adapter for the first memory slice.
 *
 * UserFact already provides durable, user-owned storage in the current schema.
 * Memory values are serialized as JSON so the higher-level Memory contract can
 * remain richer than the underlying MVP table without coupling the Brain to Prisma.
 * A dedicated Memory table can be introduced later without changing the repository contract.
 */
@Injectable()
export class PrismaMemoryRepository implements MemoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(memory: Memory): Promise<void> {
    const userId = this.requireUserId(memory.userId);

    await this.prisma.userFact.create({
      data: {
        id: memory.id,
        userId,
        category: memory.type,
        key: memory.key,
        value: JSON.stringify(memory.value),
        importance: memory.importance,
        source: 'brain-memory',
        createdAt: memory.createdAt,
        updatedAt: memory.updatedAt,
      },
    });
  }

  async update(memory: Memory): Promise<void> {
    const userId = this.requireUserId(memory.userId);

    await this.prisma.userFact.updateMany({
      where: { id: memory.id, userId, source: 'brain-memory' },
      data: {
        category: memory.type,
        key: memory.key,
        value: JSON.stringify(memory.value),
        importance: memory.importance,
        updatedAt: memory.updatedAt,
      },
    });
  }

  async findById(id: string, userId?: string): Promise<Memory | null> {
    const ownerId = this.requireUserId(userId);

    const fact = await this.prisma.userFact.findFirst({
      where: { id, userId: ownerId, source: 'brain-memory' },
    });

    return fact ? this.toMemory(fact) : null;
  }

  async findByKey(key: string, userId?: string): Promise<Memory | null> {
    const ownerId = this.requireUserId(userId);

    const fact = await this.prisma.userFact.findFirst({
      where: {
        key,
        userId: ownerId,
        source: 'brain-memory',
      },
      orderBy: { updatedAt: 'desc' },
    });

    return fact ? this.toMemory(fact) : null;
  }

  async getAll(userId?: string): Promise<Memory[]> {
    const ownerId = this.requireUserId(userId);

    const facts = await this.prisma.userFact.findMany({
      where: { userId: ownerId, source: 'brain-memory' },
      orderBy: { updatedAt: 'desc' },
    });

    return facts.map((fact) => this.toMemory(fact));
  }

  async delete(id: string, userId?: string): Promise<void> {
    const ownerId = this.requireUserId(userId);

    await this.prisma.userFact.deleteMany({
      where: { id, userId: ownerId, source: 'brain-memory' },
    });
  }

  private requireUserId(userId?: string): string {
    if (!userId) {
      throw new BadRequestException(
        'userId is required for persistent memory operations',
      );
    }

    return userId;
  }

  private toMemory(fact: {
    id: string;
    userId: string;
    category: string;
    key: string;
    value: string;
    importance: number;
    createdAt: Date;
    updatedAt: Date;
  }): Memory {
    return {
      id: fact.id,
      userId: fact.userId,
      type: this.toMemoryType(fact.category),
      key: fact.key,
      value: this.parseValue(fact.value),
      importance: fact.importance,
      createdAt: fact.createdAt,
      updatedAt: fact.updatedAt,
    };
  }

  private toMemoryType(value: string): MemoryType {
    return Object.values(MemoryType).includes(value as MemoryType)
      ? (value as MemoryType)
      : MemoryType.KNOWLEDGE;
  }

  private parseValue(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
