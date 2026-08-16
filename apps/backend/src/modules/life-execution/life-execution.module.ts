import { Module } from '@nestjs/common';
import { LifeExecutionController } from './controllers/life-execution.controller';
import { LifeExecutionService } from './services/life-execution.service';

@Module({
  controllers: [LifeExecutionController],
  providers: [LifeExecutionService],
  exports: [LifeExecutionService],
})
export class LifeExecutionModule {}
