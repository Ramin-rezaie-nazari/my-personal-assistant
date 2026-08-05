import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AssistantService } from '../services/assistant.service';
import { UpdateAssistantProfileDto } from '../dto/update-assistant-profile.dto';

@Controller('assistant')
@UseGuards(JwtAuthGuard)
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Get('profile')
  getProfile(@Request() req: { user: { id: string } }) {
    return this.assistantService.getProfile(req.user.id);
  }

  @Patch('profile')
  updateProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateAssistantProfileDto,
  ) {
    return this.assistantService.updateProfile(req.user.id, dto);
  }
}
