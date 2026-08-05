import { Injectable } from '@nestjs/common';

@Injectable()
export class IntentionAnalysisService {
  async detectIntent(input: string) {
    await Promise.resolve();

    return {
      intent: 'unknown',
      input,
    };
  }
}
