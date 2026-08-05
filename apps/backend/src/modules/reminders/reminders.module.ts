import { Module } from '@nestjs/common';
import { RemindersController } from './controllers/reminders.controller';
import { RemindersService } from './services/reminders.service';

@Module({
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
