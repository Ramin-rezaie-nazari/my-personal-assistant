import { Injectable } from '@nestjs/common';

import { RelevantMemoryContextService } from './relevant-memory-context.service';

interface BrainMemoryContext {
  memories: Array<{
    content: string;
    score: number;
  }>;
}

@Injectable()
export class BrainMemoryContextService {
  constructor(
    private readonly relevantMemoryContextService: RelevantMemoryContextService,
  ) {}

  async buildMemoryContext(query: string): Promise<BrainMemoryContext> {
    const context = await this.relevantMemoryContextService.buildContext(query);

    return {
      memories: context.memories,
    };
  }
}
