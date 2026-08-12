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
import { CreateBrainRequestDto } from '../dto/create-brain-request.dto';
import { BrainOrchestratorService } from '../services/brain-orchestrator.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@Controller('personal-brain')
export class PersonalBrainController {
  constructor(
    private readonly brainOrchestratorService: BrainOrchestratorService,
  ) {}

  @Get()
  getStatus() {
    return {
      module: 'personal-brain',
      status: 'ready',
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async process(
    @Body() dto: CreateBrainRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.brainOrchestratorService.processRequest(dto.message, req.user.id);
  }
}
