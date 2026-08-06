import { Injectable } from '@nestjs/common';

import { MemoryIntelligenceService } from '../../memory-intelligence/services/memory-intelligence.service';

@Injectable()
export class BrainMemoryService {
  constructor(
    private readonly memoryIntelligenceService: MemoryIntelligenceService,
  ) {}

  async getMemories() {
    return this.memoryIntelligenceService.getMemories();
  }
}
