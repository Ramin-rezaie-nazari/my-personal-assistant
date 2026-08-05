import { Controller, Get, Post } from '@nestjs/common';
import { HabitsService } from '../services/habits.service';

@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post()
  create() {
    return this.habitsService.createHabit();
  }

  @Get()
  findAll() {
    return this.habitsService.getHabits();
  }
}
