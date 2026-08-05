import { Controller, Get, Post } from '@nestjs/common';
import { CalendarService } from '../services/calendar.service';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  createEvent() {
    return this.calendarService.createEvent();
  }

  @Get()
  findAll() {
    return this.calendarService.getEvents();
  }
}
