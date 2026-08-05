import { Controller, Get } from '@nestjs/common';
import { AssistantService } from '../services/assistant.service';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Get()
  getStatus() {
    return this.assistantService.getStatus();
  }
}
