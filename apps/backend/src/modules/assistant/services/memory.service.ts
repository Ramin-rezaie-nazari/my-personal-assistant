import { Injectable } from '@nestjs/common';

@Injectable()
export class MemoryService {
  async storeMemory() {
    await Promise.resolve();

    return {
      message: 'Memory engine ready',
    };
  }

  async getMemories() {
    await Promise.resolve();

    return [];
  }
}
