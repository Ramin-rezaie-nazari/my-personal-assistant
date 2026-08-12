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
import { CreateWorkoutDto } from '../dto/create-workout.dto';
import { WorkoutService } from '../services/workout.service';

@Controller('workout')
@UseGuards(JwtAuthGuard)
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Post()
  createWorkout(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateWorkoutDto,
  ) {
    return this.workoutService.createWorkout(req.user.id, dto);
  }

  @Get()
  getWorkouts(@Request() req: { user: { id: string } }) {
    return this.workoutService.getWorkouts(req.user.id);
  }

  @Get('weekly-summary')
  getWeeklySummary(
    @Request() req: { user: { id: string } },
    @Query('dateKey') dateKey?: string,
  ) {
    return this.workoutService.getWeeklySummary(req.user.id, dateKey);
  }

  @Patch(':id')
  updateWorkout(
    @Request() req: { user: { id: string } },
    @Param('id') workoutId: string,
    @Body() dto: Partial<CreateWorkoutDto>,
  ) {
    return this.workoutService.updateWorkout(req.user.id, workoutId, dto);
  }

  @Delete(':id')
  deleteWorkout(
    @Request() req: { user: { id: string } },
    @Param('id') workoutId: string,
  ) {
    return this.workoutService.deleteWorkout(req.user.id, workoutId);
  }
}
