import { Injectable } from '@nestjs/common';

@Injectable()
export class AssistantService {
  async getStatus() {
    await Promise.resolve();

    return {
      name: 'My Personal Assistant',
      status: 'brain foundation active',
    };
  }
}
