import { Injectable } from '@nestjs/common';

@Injectable()
export class ContextBuilderService {
  async createSnapshot() {
    await Promise.resolve();

    return {
      userState: {},
      timestamp: new Date(),
    };
  }
}
