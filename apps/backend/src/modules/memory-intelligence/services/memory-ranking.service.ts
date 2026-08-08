import { Injectable } from '@nestjs/common';

import { Memory } from '../models/memory.model';

interface RankedMemory {
  content: string;
  score: number;
}

@Injectable()
export class MemoryRankingService {
  rank(memories: Memory[]): RankedMemory[] {
    return memories
      .map((memory) => {
        const content = this.toSearchableContent(memory);

        return {
          content,
          score: this.calculateScore(memory, content),
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  private calculateScore(memory: Memory, content: string): number {
    const baseImportance = memory.importance;

    const lengthBonus = Math.min(content.length / 100, 1) * 0.2;

    return Number((baseImportance + lengthBonus).toFixed(2));
  }

  private toSearchableContent(memory: Memory): string {
    if (typeof memory.value === 'string') {
      return memory.value;
    }

    return JSON.stringify(memory.value) ?? '';
  }
}
