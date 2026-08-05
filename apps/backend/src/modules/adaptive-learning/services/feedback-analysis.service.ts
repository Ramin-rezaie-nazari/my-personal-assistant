import { Injectable } from '@nestjs/common';

@Injectable()
export class FeedbackAnalysisService {
  async analyzeFeedback() {
    await Promise.resolve();

    return {
      message: 'Feedback analyzed',
    };
  }
}
