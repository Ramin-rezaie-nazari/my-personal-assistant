import { Controller } from '@nestjs/common';

import { ContextEngineService } from '../services/context-engine.service';

@Controller('context-engine')
export class ContextEngineController {
  constructor(private readonly contextEngineService: ContextEngineService) {}
}
