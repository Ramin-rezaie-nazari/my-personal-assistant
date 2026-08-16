import { Module } from '@nestjs/common';
import { LifeTasksController } from './controllers/life-tasks.controller';
import { LifeTasksService } from './services/life-tasks.service';

@Module({
  controllers: [LifeTasksController],
  providers: [LifeTasksService],
  exports: [LifeTasksService],
})
export class LifeTasksModule {}
