import { Injectable } from '@nestjs/common';

import { MemoryRetrievalService } from './memory-retrieval.service';
import { MemoryRankingService } from './memory-ranking.service';

interface RankedMemoryResult {
  content: string;
  score: number;
}

@Injectable()
export class MemoryRelevanceService {
  constructor(
    private readonly memoryRetrievalService: MemoryRetrievalService,
    private readonly memoryRankingService: MemoryRankingService,
  ) {}

  async findRelevantMemories(query: string): Promise<RankedMemoryResult[]> {
    const memories = await this.memoryRetrievalService.search(query);

    return this.memoryRankingService.rank(memories, query);
  }
}
