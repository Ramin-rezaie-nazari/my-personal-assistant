import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ConfirmAssistantRequestDto } from '../dto/confirm-assistant-request.dto';
import { ProcessAssistantRequestDto } from '../dto/process-assistant-request.dto';
import { AssistantService } from '../services/assistant.service';
import { HouseholdNaturalCommandService } from '../services/household-natural-command.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@Controller('assistant')
export class AssistantController {
  constructor(
    private readonly assistantService: AssistantService,
    private readonly householdCommands: HouseholdNaturalCommandService,
  ) {}

  @Get()
  getStatus() {
    return this.assistantService.getStatus();
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@Req() req: AuthenticatedRequest, @Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 24;
    return this.assistantService.getHistory(req.user.id, Number.isFinite(parsed) ? parsed : 24);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async process(@Body() dto: ProcessAssistantRequestDto, @Req() req: AuthenticatedRequest) {
    const household = await this.householdCommands.tryExecute(req.user.id, dto.message, dto.locale);
    if (household.handled) return { ...household, intent: 'household', metadata: { deterministic: true } };
    return this.assistantService.process(dto.message, req.user.id, dto.locale);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  async confirm(@Body() body: ConfirmAssistantRequestDto, @Req() req: AuthenticatedRequest) {
    return this.assistantService.confirm(req.user.id, body.token);
  }
}
