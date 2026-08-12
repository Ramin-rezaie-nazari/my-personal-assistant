import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CalendarService } from '../services/calendar.service';
import { CreateCalendarEventDto } from '../dto/create-calendar-event.dto';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  createEvent(@Request() req: { user: { id: string } }, @Body() dto: CreateCalendarEventDto) {
    return this.calendarService.createEvent(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: { user: { id: string } }, @Query('from') from?: string, @Query('to') to?: string) {
    return this.calendarService.getEvents(req.user.id, from, to);
  }

  @Post(':id/complete')
  complete(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.calendarService.completeEvent(req.user.id, id);
  }
}
