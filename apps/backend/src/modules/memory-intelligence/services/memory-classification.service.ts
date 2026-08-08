import { Injectable } from '@nestjs/common';

import { Memory } from '../models/memory.model';

@Injectable()
export class MemoryClassificationService {
  classify(input: Memory): Record<string, unknown> {
    return {
      type: input.type,
      input,
    };
  }
}
