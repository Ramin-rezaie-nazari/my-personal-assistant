import { Injectable } from '@nestjs/common';

@Injectable()
export class PersonalizationService {
  async personalize() {
    await Promise.resolve();

    return {
      personalized: true,
    };
  }
}
