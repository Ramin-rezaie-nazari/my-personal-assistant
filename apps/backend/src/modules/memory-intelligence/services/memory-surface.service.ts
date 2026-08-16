import { Injectable } from '@nestjs/common';
import { Memory } from '../models/memory.model';

@Injectable()
export class MemorySurfaceService {
  filterForUser(memories: Memory[], limit = 20): Memory[] {
    return memories
      .filter(
        (memory) =>
          memory.visibility === 'user_visible' &&
          (memory.confidence ?? 0) >= 0.75 &&
          memory.importance >= 0.6,
      )
      .sort(
        (a, b) =>
          b.importance * (b.confidence ?? 0) -
          a.importance * (a.confidence ?? 0),
      )
      .slice(0, Math.max(1, Math.min(limit, 100)));
  }

  filterForBrain(memories: Memory[], now = new Date(), limit = 100): Memory[] {
    return memories
      .filter((memory) => !memory.expiresAt || memory.expiresAt > now)
      .filter(
        (memory) =>
          (memory.confidence ?? 0) >= 0.35 || memory.source === 'explicit_user',
      )
      .sort((a, b) => {
        const visibilityPriority = (visibility: Memory['visibility']) =>
          visibility === 'internal' ? 1 : 0;
        const visibilityDelta =
          visibilityPriority(b.visibility) - visibilityPriority(a.visibility);
        if (visibilityDelta !== 0) return visibilityDelta;
        return (
          b.importance * (b.confidence ?? 0) -
          a.importance * (a.confidence ?? 0)
        );
      })
      .slice(0, Math.max(1, Math.min(limit, 500)));
  }
}
