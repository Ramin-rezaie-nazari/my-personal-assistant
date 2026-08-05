import { Injectable } from '@nestjs/common';

@Injectable()
export class ContextService {
  async buildContext() {
    await Promise.resolve();

    return {
      message: 'Context engine ready',
    };
  }
}
