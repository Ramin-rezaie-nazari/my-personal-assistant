import { Injectable } from '@nestjs/common';
import { LifeContext, LifeContextSourceInput } from '../types/life-context';
import { LifeContextFusionService } from './life-context-fusion.service';

@Injectable()
export class ContextEngineService {
  constructor(private readonly fusion: LifeContextFusionService) {}

  async buildContext(
    userId: string,
    sources: Partial<
      Record<
        keyof Omit<LifeContext, 'userId' | 'generatedAt' | 'timezone'>,
        LifeContextSourceInput
      >
    > = {},
  ) {
    return this.fusion.build(userId, sources);
  }
}
