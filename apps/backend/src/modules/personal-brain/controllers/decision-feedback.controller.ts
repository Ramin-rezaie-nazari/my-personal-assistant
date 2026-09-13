import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DecisionFeedbackDto } from '../dto/personal-brain-action.dto';
import { DecisionFeedbackLoopService } from '../services/decision-feedback-loop.service';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('personal-brain/decision')
export class DecisionFeedbackController {
  constructor(private readonly feedbackLoop: DecisionFeedbackLoopService) {}

  @Post('feedback')
  @UseGuards(JwtAuthGuard)
  async record(@Body() body: DecisionFeedbackDto, @Req() req: AuthenticatedRequest) {
    return this.feedbackLoop.record({ ...body, userId: req.user.id });
  }
}
