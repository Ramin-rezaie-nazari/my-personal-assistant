import { Injectable } from '@nestjs/common';

import { MemoryRepository } from '../repositories/memory.repository';

interface MemoryItem {
  id: string;
  key: string;
  content: string;
}

@Injectable()
export class MemoryRetrievalService {
  constructor(private readonly memoryRepository: MemoryRepository) {}

  async search(query: string): Promise<MemoryItem[]> {
    const memories: MemoryItem[] = await this.memoryRepository.getAll();

    return memories.filter((memory) =>
      memory.content.toLowerCase().includes(query.toLowerCase()),
    );
  }

  async retrieveByKey(key: string): Promise<MemoryItem | undefined> {
    const memory: MemoryItem | undefined =
      await this.memoryRepository.findByKey(key);

    return memory;
  }
}
