import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DecisionCandidate } from '../services/unified-decision-engine.service';
import { DecisionFeedbackLoopService } from '../services/decision-feedback-loop.service';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

type FeedbackBody = {
  candidate: DecisionCandidate;
  outcome: 'accepted' | 'completed' | 'dismissed' | 'failed' | 'skipped';
  reward?: number;
  note?: string;
};

@Controller('personal-brain/decision')
export class DecisionFeedbackController {
  constructor(private readonly feedbackLoop: DecisionFeedbackLoopService) {}

  @Post('feedback')
  @UseGuards(JwtAuthGuard)
  async record(@Body() body: FeedbackBody, @Req() req: AuthenticatedRequest) {
    return this.feedbackLoop.record({ ...body, userId: req.user.id });
  }
}
