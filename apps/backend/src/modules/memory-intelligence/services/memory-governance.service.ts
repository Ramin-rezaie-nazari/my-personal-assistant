import { Injectable } from '@nestjs/common';
import { MemoryGoverned, MemoryRetention } from '../models/memory-governance.model';

@Injectable()
export class MemoryGovernanceService {
  private readonly retentionMs: Record<MemoryRetention, number | null> = {
    session: 0,
    '1_month': 30 * 24 * 60 * 60 * 1000,
    '3_months': 90 * 24 * 60 * 60 * 1000,
    '6_months': 180 * 24 * 60 * 60 * 1000,
    '1_year': 365 * 24 * 60 * 60 * 1000,
    unlimited: null,
  };

  applyRetention(memory: MemoryGoverned, now = new Date()): MemoryGoverned {
    const duration = this.retentionMs[memory.retention];
    return duration === null
      ? { ...memory, expiresAt: undefined }
      : { ...memory, expiresAt: new Date(memory.createdAt.getTime() + duration) };
  }

  isExpired(memory: MemoryGoverned, now = new Date()): boolean {
    return Boolean(memory.expiresAt && memory.expiresAt <= now);
  }

  shouldReinforce(memory: MemoryGoverned): boolean {
    return memory.source === 'explicit_user' || memory.confidence < 0.75 || memory.importance >= 0.8;
  }

  markConfirmed(memory: MemoryGoverned, at = new Date()): MemoryGoverned {
    return { ...memory, lastConfirmedAt: at, confidence: Math.min(1, memory.confidence + 0.05) };
  }
}
