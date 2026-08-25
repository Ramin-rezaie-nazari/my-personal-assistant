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
import { ProcessAssistantRequestDto } from '../dto/process-assistant-request.dto';
import { AssistantService } from '../services/assistant.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

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

  @Post()
  @UseGuards(JwtAuthGuard)
  async process(
    @Body() dto: ProcessAssistantRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.assistantService.process(dto.message, req.user.id, dto.locale);
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
