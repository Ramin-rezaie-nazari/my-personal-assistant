import { Inject, Injectable } from '@nestjs/common';

import { Memory } from '../models/memory.model';
import { MEMORY_REPOSITORY } from '../repositories/memory.repository';
import type { MemoryRepository } from '../repositories/memory.repository';

@Injectable()
export class MemoryIntelligenceService {
  constructor(
    @Inject(MEMORY_REPOSITORY)
    private readonly memoryRepository: MemoryRepository,
  ) {}

  async remember(memory: Memory): Promise<void> {
    await this.memoryRepository.save(memory);
  }

  async recall(id: string, userId?: string): Promise<Memory | null> {
    return this.memoryRepository.findById(id, userId);
  }

  async recallByKey(key: string, userId?: string): Promise<Memory | null> {
    return this.memoryRepository.findByKey(key, userId);
  }

  async getMemories(userId?: string): Promise<Memory[]> {
    return this.memoryRepository.getAll(userId);
  }

  async forget(id: string, userId?: string): Promise<void> {
    await this.memoryRepository.delete(id, userId);
  }
}
