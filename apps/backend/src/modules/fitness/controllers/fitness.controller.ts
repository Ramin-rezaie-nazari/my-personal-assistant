import {
  BadRequestException,
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
import { FitnessGoal, FitnessProfile } from '../models/fitness.model';
import { FitnessCatalogService } from '../services/fitness-catalog.service';
import type { FitnessDiscipline } from '../services/fitness-catalog.service';
import { FitnessProfileService } from '../services/fitness-profile.service';
import { FitnessProgressService } from '../services/fitness-progress.service';

type AuthenticatedRequest = { user: { sub: string } };

@Controller('fitness')
@UseGuards(JwtAuthGuard)
export class FitnessController {
  constructor(
    private readonly profile: FitnessProfileService,
    private readonly catalog: FitnessCatalogService,
    private readonly progress: FitnessProgressService,
  ) {}

  @Get('profile')
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.profile.get(req.user.sub);
  }

  @Get('context')
  context(@Req() req: AuthenticatedRequest) {
    return this.profile.buildRecommendationContext(req.user.sub);
  }

  @Get('progress')
  getProgress(@Req() req: AuthenticatedRequest) {
    return this.progress.list(req.user.sub);
  }

  @Get('progress/:discipline')
  getDisciplineProgress(
    @Req() req: AuthenticatedRequest,
    @Param('discipline') discipline: string,
  ) {
    if (!['gym', 'calisthenics', 'yoga'].includes(discipline)) {
      throw new BadRequestException('discipline must be gym, calisthenics or yoga');
    }
    return this.progress.get(req.user.sub, discipline as FitnessDiscipline);
  }

  @Post('progress/session')
  recordProgress(
    @Req() req: AuthenticatedRequest,
    @Body() body: { discipline: FitnessDiscipline; difficulty: number; completed: boolean; formScore?: number | null },
  ) {
    if (!['gym', 'calisthenics', 'yoga'].includes(body.discipline)) {
      throw new BadRequestException('discipline must be gym, calisthenics or yoga');
    }
    if (!Number.isInteger(body.difficulty) || body.difficulty < 1 || body.difficulty > 10) {
      throw new BadRequestException('difficulty must be an integer between 1 and 10');
    }
    return this.progress.recordSession({ userId: req.user.sub, ...body });
  }

  @Get('catalog')
  catalogList(
    @Query('discipline') discipline?: FitnessDiscipline,
    @Query('level') levelText?: string,
    @Query('q') query?: string,
    @Query('page') pageText?: string,
    @Query('pageSize') pageSizeText?: string,
    @Query('equipment') equipmentCsv?: string,
  ) {
    if (!discipline || !['gym', 'calisthenics', 'yoga'].includes(discipline)) {
      throw new BadRequestException('discipline must be gym, calisthenics or yoga');
    }
    return this.catalog.list({
      discipline,
      level: parseOptionalInt(levelText, 'level', 1, 10),
      page: parseOptionalInt(pageText, 'page', 1, 100000),
      pageSize: parseOptionalInt(pageSizeText, 'pageSize', 1, 50),
      query,
      equipment: equipmentCsv?.split(',').map((value) => value.trim()).filter(Boolean),
    });
  }

  @Get('catalog/:discipline/:id')
  async catalogOne(@Param('discipline') discipline: string, @Param('id') id: string) {
    if (!['gym', 'calisthenics', 'yoga'].includes(discipline)) {
      throw new BadRequestException('discipline must be gym, calisthenics or yoga');
    }
    const item = await this.catalog.getOne(discipline as FitnessDiscipline, id);
    if (!item) throw new BadRequestException('exercise not found');
    return item;
  }

  @Post('profile')
  save(
    @Req() req: AuthenticatedRequest,
    @Body() body: { profile: FitnessProfile },
  ) {
    return this.profile.save(req.user.sub, body.profile);
  }

  @Post('equipment')
  addEquipment(
    @Req() req: AuthenticatedRequest,
    @Body() body: { item: FitnessProfile['equipment'][number] },
  ) {
    return this.profile.addEquipment(req.user.sub, body.item);
  }

  @Delete('equipment/:id')
  removeEquipment(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.profile.removeEquipment(req.user.sub, id);
  }

  @Post('goal')
  addGoal(
    @Req() req: AuthenticatedRequest,
    @Body() body: { goal: FitnessGoal },
  ) {
    return this.profile.addGoal(req.user.sub, body.goal);
  }

  @Post('goal/from-text')
  parseGoal(@Body() body: { text: string }) {
    return this.profile.parseNaturalGoal(body.text);
  }
}

function parseOptionalInt(value: string | undefined, name: string, min: number, max: number) {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new BadRequestException(`${name} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}
