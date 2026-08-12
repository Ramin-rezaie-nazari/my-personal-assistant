import {
  Body,
  Controller,
  Get,
  Post,
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

  @Post()
  @UseGuards(JwtAuthGuard)
  async process(
    @Body() dto: ProcessAssistantRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.assistantService.process(dto.message, req.user.id);
  }
}
