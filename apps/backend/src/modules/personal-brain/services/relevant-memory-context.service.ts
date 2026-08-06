import { Injectable } from '@nestjs/common';

import { MemoryRelevanceService } from '../../memory-intelligence/services/memory-relevance.service';

interface RelevantMemoryContext {
  query: string;
  memories: Array<{
    content: string;
    score: number;
  }>;
}

@Injectable()
export class RelevantMemoryContextService {
  constructor(
    private readonly memoryRelevanceService: MemoryRelevanceService,
  ) {}

  async buildContext(query: string): Promise<RelevantMemoryContext> {
    const memories =
      await this.memoryRelevanceService.findRelevantMemories(query);

    return {
      query,
      memories,
    };
  }
}
