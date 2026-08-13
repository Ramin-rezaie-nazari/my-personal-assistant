import { Body, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Equipment, CalisthenicsSession } from '../models/calisthenics.model';
import type { CalisthenicsFocus, CalisthenicsLevel } from '../models/calisthenics.model';
import { CalisthenicsLibraryService } from '../services/calisthenics-library.service';
import { CalisthenicsSessionGeneratorService } from '../services/calisthenics-session-generator.service';
import { CalisthenicsCoachService, CalisthenicsCoachState } from '../services/calisthenics-coach.service';

@Controller('calisthenics')
export class CalisthenicsController {
  constructor(private readonly library: CalisthenicsLibraryService, private readonly generator: CalisthenicsSessionGeneratorService, private readonly coach: CalisthenicsCoachService) {}

  @Get('exercises') @UseGuards(JwtAuthGuard)
  exercises(@Query('level') level?: CalisthenicsLevel, @Query('focus') focus?: CalisthenicsFocus, @Query('equipment') equipmentCsv?: string) {
    const equipment = equipmentCsv?.split(',').filter(Boolean) as Equipment[] | undefined;
    const items = this.library.list(level, focus, equipment?.length ? equipment : ['none']);
    return { count: items.length, items };
  }

  @Post('session') @UseGuards(JwtAuthGuard)
  session(@Body() body: { durationMin: number; level?: CalisthenicsLevel; focus?: CalisthenicsFocus; equipment?: Equipment[]; progress?: Record<string, unknown> }) {
    return this.generator.generate({ durationMin: body.durationMin, level: body.level, focus: body.focus, equipment: body.equipment, progress: body.progress });
  }

  @Post('coach/start') @UseGuards(JwtAuthGuard)
  start(@Body() body: { session: CalisthenicsSession }) { return this.coach.start(body.session); }

  @Post('coach/tick') @UseGuards(JwtAuthGuard)
  tick(@Body() body: { session: CalisthenicsSession; state: CalisthenicsCoachState; elapsedSec?: number }) { return this.coach.tick(body.session, body.state, body.elapsedSec); }
}
