import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CalendarService } from '../services/calendar.service';
import { CreateCalendarEventDto } from '../dto/create-calendar-event.dto';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  createEvent(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateCalendarEventDto,
  ) {
    return this.calendarService.createEvent(req.user.id, dto);
  }

  @Get()
  findAll(
    @Request() req: { user: { id: string } },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.calendarService.getEvents(req.user.id, from, to);
  }

  @Patch(':id')
  updateEvent(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      type?: string;
      startsAt?: string;
      endsAt?: string | null;
    },
  ) {
    return this.calendarService.updateEvent(req.user.id, id, body);
  }

  @Post(':id/complete')
  complete(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.calendarService.completeEvent(req.user.id, id);
  }

  @Post(':id/reopen')
  reopen(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.calendarService.reopenEvent(req.user.id, id);
  }

  @Delete(':id')
  delete(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.calendarService.deleteEvent(req.user.id, id);
  }
}
