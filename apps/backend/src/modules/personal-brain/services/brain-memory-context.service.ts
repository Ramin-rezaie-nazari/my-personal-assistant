import { Injectable } from '@nestjs/common';

import { RelevantMemoryContextService } from './relevant-memory-context.service';

import { BrainMemoryContext } from '../types';

@Injectable()
export class BrainMemoryContextService {
  constructor(
    private readonly relevantMemoryContextService: RelevantMemoryContextService,
  ) {}

  async buildMemoryContext(
    query: string,
    userId: string,
  ): Promise<BrainMemoryContext> {
    const context = await this.relevantMemoryContextService.buildContext(
      query,
      userId,
    );

    return {
      memories: context.memories,
    };
  }
}
