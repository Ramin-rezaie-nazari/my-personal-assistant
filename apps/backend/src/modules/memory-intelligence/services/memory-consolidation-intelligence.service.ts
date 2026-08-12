import { Injectable } from '@nestjs/common';
import { MemoryGoverned } from '../models/memory-governance.model';

export type ConsolidationResult = {
  representative: MemoryGoverned;
  absorbedMemoryIds: string[];
  confidence: number;
  reason: string;
};

@Injectable()
export class MemoryConsolidationIntelligenceService {
  consolidate(group: MemoryGoverned[]): ConsolidationResult | null {
    if (!group.length) return null;
    const ordered = [...group].sort((a, b) => (b.importance * b.confidence) - (a.importance * a.confidence));
    const representative = ordered[0];
    const confidence = Math.min(1, ordered.reduce((sum, item) => sum + item.confidence, 0) / ordered.length + Math.min(0.2, (ordered.length - 1) * 0.02));
    return {
      representative: { ...representative, confidence, relatedMemoryIds: [...new Set(ordered.flatMap((item) => item.relatedMemoryIds).concat(ordered.slice(1).map((item) => item.memoryId)))] },
      absorbedMemoryIds: ordered.slice(1).map((item) => item.memoryId),
      confidence,
      reason: 'merged_repeated_signals_into_highest_value_memory',
    };
  }

  shouldSurface(memory: MemoryGoverned): boolean {
    return memory.visibility === 'user_visible' && memory.confidence >= 0.75 && memory.importance >= 0.6;
  }
}
