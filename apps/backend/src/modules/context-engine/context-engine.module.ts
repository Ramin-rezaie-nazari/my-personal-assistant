import { Module } from '@nestjs/common';

import { ContextEngineController } from './controllers/context-engine.controller';
import { ContextEngineService } from './services/context-engine.service';
import { ContextBuilderService } from './services/context-builder.service';
import { LifeContextFusionService } from './services/life-context-fusion.service';

@Module({
  controllers: [ContextEngineController],
  providers: [ContextEngineService, ContextBuilderService, LifeContextFusionService],
  exports: [ContextEngineService, ContextBuilderService, LifeContextFusionService],
})
export class ContextEngineModule {}
