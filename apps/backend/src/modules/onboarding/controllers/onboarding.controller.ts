import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OnboardingService } from '../services/onboarding.service';
import { CompleteOnboardingDto } from '../dto/complete-onboarding.dto';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('status')
  status(@Request() req: { user: { id: string } }) {
    return this.onboardingService.getStatus(req.user.id);
  }

  @Post('complete')
  complete(
    @Request() req: { user: { id: string } },
    @Body() dto: CompleteOnboardingDto,
  ) {
    return this.onboardingService.complete(req.user.id, dto.currentStep);
  }
}
