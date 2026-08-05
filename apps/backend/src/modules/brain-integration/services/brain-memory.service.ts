import { Injectable } from '@nestjs/common';

@Injectable()
export class BrainMemoryService {
  async retrieveRelevantMemory() {
    await Promise.resolve();

    return {
      memoryReady: true,
    };
  }
}
