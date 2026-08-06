import { Injectable } from '@nestjs/common';

@Injectable()
export class BrainMemoryService {
  async getMemories() {
    await Promise.resolve();

    return [];
  }
}
