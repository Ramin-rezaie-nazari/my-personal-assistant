import { Injectable } from '@nestjs/common';

@Injectable()
export class MemoryConsolidationService {
  consolidate(data: Record<string, unknown>): Record<string, unknown> {
    return {
      consolidated: true,
      data,
    };
  }
}
