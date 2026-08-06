import { Injectable } from '@nestjs/common';

@Injectable()
export class MemoryScoringService {
  score(input: Record<string, unknown>): Record<string, unknown> {
    return {
      importance: 0,
      input,
    };
  }
}
