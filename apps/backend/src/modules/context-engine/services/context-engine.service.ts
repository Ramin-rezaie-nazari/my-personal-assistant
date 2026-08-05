import { Injectable } from '@nestjs/common';

@Injectable()
export class ContextEngineService {
  async buildContext() {
    await Promise.resolve();

    return {
      message: 'User context generated',
      context: {},
    };
  }
}
