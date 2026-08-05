import { Body, Controller, Get, Post } from '@nestjs/common';
import { RemindersService } from '../services/reminders.service';
import { CreateReminderDto } from '../dto/create-reminder.dto';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  create(@Body() dto: CreateReminderDto) {
    return this.remindersService.createReminder(dto);
  }

  @Get()
  findAll() {
    return this.remindersService.getReminders();
  }
}
