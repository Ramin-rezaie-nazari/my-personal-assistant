import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProcessAssistantRequestDto } from '../dto/process-assistant-request.dto';
import { AssistantService } from '../services/assistant.service';
import {
  GlobalUserSettingsService,
  UpdateGlobalUserSettings,
} from '../services/global-user-settings.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@Controller('assistant')
export class AssistantController {
  constructor(
    private readonly assistantService: AssistantService,
    private readonly globalUserSettings: GlobalUserSettingsService,
  ) {}

  @Get()
  getStatus() {
    return this.assistantService.getStatus();
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
  ) {
    const parsed = limit ? Number(limit) : 24;
    return this.assistantService.getHistory(
      req.user.id,
      Number.isFinite(parsed) ? parsed : 24,
    );
  }

  @Get('settings/global')
  @UseGuards(JwtAuthGuard)
  getGlobalSettings(@Req() req: AuthenticatedRequest) {
    return this.globalUserSettings.get(req.user.id);
  }

  @Patch('settings/global')
  @UseGuards(JwtAuthGuard)
  updateGlobalSettings(
    @Body() body: UpdateGlobalUserSettings,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.globalUserSettings.update(req.user.id, body);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async process(
    @Body() dto: ProcessAssistantRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.assistantService.process(dto.message, req.user.id);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  async confirm(
    @Body() body: { token: string },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.assistantService.confirm(req.user.id, body.token);
  }
}
