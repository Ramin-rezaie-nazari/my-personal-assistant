import { Body, Controller, Get, Post } from '@nestjs/common';

import { CreateBrainRequestDto } from '../dto/create-brain-request.dto';
import { BrainOrchestratorService } from '../services/brain-orchestrator.service';

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
  async process(@Body() dto: CreateBrainRequestDto) {
    return this.brainOrchestratorService.processRequest(dto.message);
  }
}
