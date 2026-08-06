import { Injectable } from '@nestjs/common';

@Injectable()
export class MemoryClassificationService {
  classify(input: Record<string, unknown>): Record<string, unknown> {
    return {
      type: 'general',
      input,
    };
  }
}
