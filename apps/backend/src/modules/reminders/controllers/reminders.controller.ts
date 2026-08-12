import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RemindersService } from '../services/reminders.service';
import { CreateReminderDto } from '../dto/create-reminder.dto';

@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateReminderDto) {
    return this.remindersService.createReminder(req.user.id, dto);
  }

  @Get()
  findAll(
    @Request() req: { user: { id: string } },
    @Query('includeCompleted') includeCompleted?: string,
  ) {
    return this.remindersService.getReminders(req.user.id, includeCompleted === 'true');
  }

  @Get('next')
  getNext(@Request() req: { user: { id: string } }) {
    return this.remindersService.getNextReminder(req.user.id);
  }

  @Post(':id/complete')
  complete(@Request() req: { user: { id: string } }, @Param('id') reminderId: string) {
    return this.remindersService.completeReminder(req.user.id, reminderId);
  }

  @Delete(':id')
  delete(@Request() req: { user: { id: string } }, @Param('id') reminderId: string) {
    return this.remindersService.deleteReminder(req.user.id, reminderId);
  }
}
