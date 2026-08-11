import { Body, Controller, Get, Post } from '@nestjs/common';

import { ProcessAssistantRequestDto } from '../dto/process-assistant-request.dto';
import { AssistantService } from '../services/assistant.service';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Get()
  getStatus() {
    return this.assistantService.getStatus();
  }

  @Post()
  async process(@Body() dto: ProcessAssistantRequestDto) {
    return this.assistantService.process(dto.message);
  }
}
