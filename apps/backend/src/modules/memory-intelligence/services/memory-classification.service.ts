import { Injectable } from '@nestjs/common';

@Injectable()
export class MemoryClassificationService {
  async classifyMemory() {
    await Promise.resolve();

    return {
      type: 'classified',
    };
  }
}
