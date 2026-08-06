import { Injectable } from '@nestjs/common';

interface MemoryScoreInput {
  content: string;
  importance?: number;
}

interface RankedMemory {
  content: string;
  score: number;
}

@Injectable()
export class MemoryRankingService {
  rank(memories: MemoryScoreInput[]): RankedMemory[] {
    return memories
      .map((memory) => ({
        content: memory.content,
        score: this.calculateScore(memory),
      }))
      .sort((a, b) => b.score - a.score);
  }

  private calculateScore(memory: MemoryScoreInput): number {
    const baseImportance = memory.importance ?? 0.5;

    const lengthBonus = Math.min(memory.content.length / 100, 1) * 0.2;

    return Number((baseImportance + lengthBonus).toFixed(2));
  }
}
