import { Module } from '@nestjs/common';

import { ContextEngineController } from './controllers/context-engine.controller';
import { ContextEngineService } from './services/context-engine.service';
import { ContextBuilderService } from './services/context-builder.service';

@Module({
  controllers: [ContextEngineController],
  providers: [ContextEngineService, ContextBuilderService],
  exports: [ContextEngineService, ContextBuilderService],
})
export class ContextEngineModule {}
