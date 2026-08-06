import { Injectable } from '@nestjs/common';

import { MemoryIntelligenceService } from '../../memory-intelligence/services/memory-intelligence.service';
import { MemoryLifecycleService } from '../../memory-intelligence/services/memory-lifecycle.service';

@Injectable()
export class BrainMemoryService {
  constructor(
    private readonly memoryIntelligenceService: MemoryIntelligenceService,
    private readonly memoryLifecycleService: MemoryLifecycleService,
  ) {}

  async getMemories() {
    const memories = await this.memoryIntelligenceService.getMemories();

    return memories.map((memory) =>
      this.memoryLifecycleService.processMemory(memory),
    );
  }
}
