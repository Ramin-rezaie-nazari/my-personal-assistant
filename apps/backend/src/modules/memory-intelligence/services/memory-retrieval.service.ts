import { Inject, Injectable } from '@nestjs/common';

import { Memory } from '../models/memory.model';
import {
  MEMORY_REPOSITORY,
  type MemoryRepository,
} from '../repositories/memory.repository';

@Injectable()
export class MemoryRetrievalService {
  constructor(
    @Inject(MEMORY_REPOSITORY)
    private readonly memoryRepository: MemoryRepository,
  ) {}

  async search(query: string): Promise<Memory[]> {
    const memories = await this.memoryRepository.getAll();
    const normalizedQuery = query.toLowerCase();

    return memories.filter((memory) => {
      const searchableValue =
        typeof memory.value === 'string'
          ? memory.value
          : (JSON.stringify(memory.value) ?? '');

      return (
        memory.key.toLowerCase().includes(normalizedQuery) ||
        searchableValue.toLowerCase().includes(normalizedQuery)
      );
    });
  }

  async retrieveByKey(key: string): Promise<Memory | undefined> {
    const memory = await this.memoryRepository.findByKey(key);

    return memory ?? undefined;
  }
}
