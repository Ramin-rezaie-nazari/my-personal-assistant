import { Injectable } from '@nestjs/common';

import { Memory } from '../models/memory.model';

interface RankedMemory {
  content: string;
  score: number;
}

@Injectable()
export class MemoryRankingService {
  rank(memories: Memory[], query = ''): RankedMemory[] {
    const normalizedQuery = this.normalize(query);

    return memories
      .map((memory) => {
        const content = this.toSearchableContent(memory);

        return {
          content,
          score: this.calculateScore(memory, content, normalizedQuery),
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  private calculateScore(
    memory: Memory,
    content: string,
    normalizedQuery: string,
  ): number {
    const baseImportance = Math.max(0, Math.min(memory.importance, 1));
    const normalizedContent = this.normalize(`${memory.key} ${content}`);

    if (!normalizedQuery) {
      return Number(
        (baseImportance + Math.min(content.length / 100, 1) * 0.1).toFixed(2),
      );
    }

    const queryTokens = this.tokens(normalizedQuery);
    const matchedTokens = queryTokens.filter((token) =>
      normalizedContent.includes(token),
    );
    const tokenMatch = queryTokens.length
      ? matchedTokens.length / queryTokens.length
      : 0;
    const exactPhraseBonus = normalizedContent.includes(normalizedQuery)
      ? 0.2
      : 0;
    const keyBonus = this.normalize(memory.key).includes(normalizedQuery)
      ? 0.15
      : 0;

    const score =
      tokenMatch * 0.65 +
      baseImportance * 0.2 +
      exactPhraseBonus +
      keyBonus;

    return Number(Math.min(score, 1).toFixed(2));
  }

  private tokens(value: string): string[] {
    return value
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length >= 2);
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  private toSearchableContent(memory: Memory): string {
    if (typeof memory.value === 'string') {
      return memory.value;
    }

    return JSON.stringify(memory.value) ?? '';
  }
}
