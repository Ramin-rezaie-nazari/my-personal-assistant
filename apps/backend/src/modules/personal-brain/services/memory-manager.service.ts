import { Injectable } from '@nestjs/common';

@Injectable()
export class MemoryManagerService {
  async storeMemory() {
    await Promise.resolve();

    return {
      message: 'Memory stored',
    };
  }
}
