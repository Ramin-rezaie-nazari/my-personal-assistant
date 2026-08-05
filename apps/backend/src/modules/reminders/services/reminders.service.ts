import { Injectable } from '@nestjs/common';
import { CreateReminderDto } from '../dto/create-reminder.dto';

@Injectable()
export class RemindersService {
  async createReminder(dto: CreateReminderDto) {
    await Promise.resolve();

    return {
      message: 'Reminder created',
      data: dto,
    };
  }

  async getReminders() {
    await Promise.resolve();

    return [];
  }
}
