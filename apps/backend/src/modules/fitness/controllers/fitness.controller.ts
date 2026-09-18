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
import { CompleteFitnessProgramSessionDto, FitnessProgramQueryDto, StartFitnessProgramDto, UpdateFitnessProgramStatusDto } from '../dto/fitness-program.dto';
import { FitnessCalculatorDto } from '../dto/fitness-calculator.dto';
import { FitnessProfileService } from '../services/fitness-profile.service';
import { ExerciseContentService } from '../services/exercise-content.service';
import { FitnessProgramService } from '../services/fitness-program.service';
import { FitnessCalculatorService } from '../services/fitness-calculator.service';
import { FitnessProgressService } from '../services/fitness-progress.service';

type AuthenticatedRequest = { user: { id: string } };

@Controller('fitness')
@UseGuards(JwtAuthGuard)
export class FitnessController {
  constructor(
    private readonly profile: FitnessProfileService,
    private readonly exercises: ExerciseContentService,
    private readonly programs: FitnessProgramService,
    private readonly calculators: FitnessCalculatorService,
    private readonly progress: FitnessProgressService,
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

  @Post('calculators')
  calculatorsPost(@Body() dto: FitnessCalculatorDto) { return this.calculators.calculate(dto); }

  @Get('progress/summary')
  progressSummary(@Req() req: AuthenticatedRequest) { return this.progress.summary(req.user.id); }

  @Get('programs')
  listPrograms(@Query() query: FitnessProgramQueryDto) { return this.programs.list(query); }

  @Get('programs/current')
  currentProgram(@Req() req: AuthenticatedRequest) { return this.programs.current(req.user.id); }

  @Get('programs/:id')
  getProgram(@Req() req: AuthenticatedRequest, @Param('id') id: string) { return this.programs.get(id, req.user.id); }

  @Post('programs/start')
  startProgram(@Req() req: AuthenticatedRequest, @Body() dto: StartFitnessProgramDto) { return this.programs.start(req.user.id, dto); }

  @Post('programs/:id/sessions/complete')
  completeSession(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: CompleteFitnessProgramSessionDto) { return this.programs.completeSession(req.user.id, id, dto); }

  @Post('programs/:id/status')
  updateProgramStatus(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateFitnessProgramStatusDto) { return this.programs.updateStatus(req.user.id, id, dto); }

  @Get('exercises')
  listExercises(@Query() query: ExerciseQueryDto) {
    return this.exercises.list(query);
  }

  @Get('exercises/:id')
  getExercise(@Param('id') id: string) {
    return this.exercises.get(id);
  }
}
