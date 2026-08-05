import { Injectable } from '@nestjs/common';

@Injectable()
export class BrainContextService {
  async collectContext() {
    await Promise.resolve();

    return {
      contextReady: true,
    };
  }
}
