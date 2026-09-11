import { Module } from '@nestjs/common';

import { ContextEngineService } from './services/context-engine.service';
import { ContextBuilderService } from './services/context-builder.service';
import { LifeContextFusionService } from './services/life-context-fusion.service';
import { ContextPriorityResolverService } from './services/context-priority-resolver.service';

@Module({
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
