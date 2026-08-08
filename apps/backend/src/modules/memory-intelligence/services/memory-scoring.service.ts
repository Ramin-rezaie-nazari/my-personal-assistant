import { Injectable } from '@nestjs/common';

import { Memory } from '../models/memory.model';

@Injectable()
export class MemoryScoringService {
  score(input: Memory): Record<string, unknown> {
    return {
      importance: input.importance,
      input,
    };
  }
}
