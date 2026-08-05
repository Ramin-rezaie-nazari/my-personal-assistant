import { Injectable } from '@nestjs/common';

@Injectable()
export class LearningMemoryService {
  async storeLearningEvent() {
    await Promise.resolve();

    return {
      message: 'Learning event stored',
    };
  }
}
