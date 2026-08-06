import { Injectable } from '@nestjs/common';

import { MemoryRepository } from './memory.repository';
import { Memory } from '../models/memory.model';

@Injectable()
export class InMemoryMemoryRepository implements MemoryRepository {
  private readonly memories: Memory[] = [];

  async save(memory: Memory): Promise<void> {
    await Promise.resolve();

    this.memories.push(memory);
  }

  async update(memory: Memory): Promise<void> {
    await Promise.resolve();

    const index = this.memories.findIndex((item) => item.id === memory.id);

    if (index !== -1) {
      this.memories[index] = memory;
    }
  }

  async findById(id: string): Promise<Memory | null> {
    await Promise.resolve();

    return this.memories.find((memory) => memory.id === id) ?? null;
  }

  async findByKey(key: string): Promise<Memory | null> {
    await Promise.resolve();

    return this.memories.find((memory) => memory.key === key) ?? null;
  }

  async getAll(): Promise<Memory[]> {
    await Promise.resolve();

    return this.memories;
  }

  async delete(id: string): Promise<void> {
    await Promise.resolve();

    const index = this.memories.findIndex((memory) => memory.id === id);

    if (index !== -1) {
      this.memories.splice(index, 1);
    }
  }
}
