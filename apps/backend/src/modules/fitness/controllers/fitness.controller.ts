import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  AddFitnessEquipmentDto,
  AddFitnessGoalDto,
  ParseFitnessGoalDto,
  SaveFitnessProfileDto,
} from '../dto/fitness.dto';
import { ExerciseQueryDto } from '../dto/exercise-content.dto';
import { FitnessProfileService } from '../services/fitness-profile.service';
import { ExerciseContentService } from '../services/exercise-content.service';

type AuthenticatedRequest = { user: { id: string } };

@Controller('fitness')
@UseGuards(JwtAuthGuard)
export class FitnessController {
  constructor(
    private readonly profile: FitnessProfileService,
    private readonly exercises: ExerciseContentService,
  ) {}

  @Get('profile')
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.profile.get(req.user.id);
  }

  @Get('context')
  context(@Req() req: AuthenticatedRequest) {
    return this.profile.buildRecommendationContext(req.user.id);
  }

  @Post('profile')
  save(@Req() req: AuthenticatedRequest, @Body() dto: SaveFitnessProfileDto) {
    return this.profile.save(req.user.id, dto.profile);
  }

  @Post('equipment')
  addEquipment(@Req() req: AuthenticatedRequest, @Body() dto: AddFitnessEquipmentDto) {
    return this.profile.addEquipment(req.user.id, dto.item);
  }

  @Delete('equipment/:id')
  removeEquipment(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.profile.removeEquipment(req.user.id, id);
  }

  @Post('goal')
  addGoal(@Req() req: AuthenticatedRequest, @Body() dto: AddFitnessGoalDto) {
    return this.profile.addGoal(req.user.id, dto.goal);
  }

  @Post('goal/from-text')
  parseGoal(@Body() dto: ParseFitnessGoalDto) {
    return this.profile.parseNaturalGoal(dto.text);
  }

  @Get('exercises')
  listExercises(@Query() query: ExerciseQueryDto) {
    return this.exercises.list(query);
  }

  @Get('exercises/:id')
  getExercise(@Param('id') id: string) {
    return this.exercises.get(id);
  }
}
