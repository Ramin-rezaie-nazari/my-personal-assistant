import { Controller, Get } from '@nestjs/common';
import { UserIntelligenceService } from '../services/user-intelligence.service';

@Controller('user-intelligence')
export class UserIntelligenceController {
  constructor(
    private readonly userIntelligenceService: UserIntelligenceService,
  ) {}

  @Get()
  getProfile() {
    return this.userIntelligenceService.getProfile();
  }
}
