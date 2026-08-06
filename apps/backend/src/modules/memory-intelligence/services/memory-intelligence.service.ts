import { Injectable } from '@nestjs/common';

import { MemoryRepository } from '../repositories/memory.repository';
import { Memory } from '../models/memory.model';

@Injectable()
export class MemoryIntelligenceService {
  constructor(private readonly memoryRepository: MemoryRepository) {}

  async remember(memory: Memory): Promise<void> {
    await this.memoryRepository.save(memory);
  }

  async recall(id: string): Promise<Memory | null> {
    return this.memoryRepository.findById(id);
  }

  async recallByKey(key: string): Promise<Memory | null> {
    return this.memoryRepository.findByKey(key);
  }

  async getMemories(): Promise<Memory[]> {
    return this.memoryRepository.getAll();
  }

  async forget(id: string): Promise<void> {
    await this.memoryRepository.delete(id);
  }
}
