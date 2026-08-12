import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateHabitDto, UpdateHabitDto } from '../dto/habit.dto';
import { HabitsService } from '../services/habits.service';

@Controller('habits')
@UseGuards(JwtAuthGuard)
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateHabitDto) { return this.habitsService.createHabit(req.user.id, dto); }

  @Get()
  findAll(@Request() req: { user: { id: string } }) { return this.habitsService.getHabits(req.user.id); }

  @Get('summary')
  summary(@Request() req: { user: { id: string } }, @Query('dateKey') dateKey?: string) { return this.habitsService.getWeeklySummary(req.user.id, dateKey); }

  @Patch(':id')
  update(@Request() req: { user: { id: string } }, @Param('id') id: string, @Body() dto: UpdateHabitDto) { return this.habitsService.updateHabit(req.user.id, id, dto); }

  @Post(':id/complete')
  complete(@Request() req: { user: { id: string } }, @Param('id') id: string, @Query('dateKey') dateKey?: string) { return this.habitsService.completeToday(req.user.id, id, dateKey); }

  @Delete(':id')
  remove(@Request() req: { user: { id: string } }, @Param('id') id: string) { return this.habitsService.deleteHabit(req.user.id, id); }
}
