import { Module } from '@nestjs/common';

import { ContextEngineController } from './controllers/context-engine.controller';
import { ContextEngineService } from './services/context-engine.service';
import { ContextBuilderService } from './services/context-builder.service';
import { LifeContextFusionService } from './services/life-context-fusion.service';
import { ContextPriorityResolverService } from './services/context-priority-resolver.service';

@Module({
  controllers: [ContextEngineController],
  providers: [
    ContextEngineService,
    ContextBuilderService,
    LifeContextFusionService,
    ContextPriorityResolverService,
  ],
  exports: [
    ContextEngineService,
    ContextBuilderService,
    LifeContextFusionService,
    ContextPriorityResolverService,
  ],
})
export class ContextEngineModule {}
