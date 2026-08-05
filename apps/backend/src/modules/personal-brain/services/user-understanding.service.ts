import { Injectable } from '@nestjs/common';

@Injectable()
export class UserUnderstandingService {
  async analyzeUser() {
    await Promise.resolve();

    return {
      message: 'User analyzed',
    };
  }
}
