import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { YogaFocus, YogaLevel, YogaSession } from '../models/yoga.model';
import { YogaCoachService, YogaCoachState } from '../services/yoga-coach.service';
import { YogaLibraryService } from '../services/yoga-library.service';
import { YogaSessionGeneratorService } from '../services/yoga-session-generator.service';

@Controller('yoga')
export class YogaController {
  constructor(private readonly library: YogaLibraryService, private readonly generator: YogaSessionGeneratorService, private readonly coach: YogaCoachService) {}

  @Get('poses') @UseGuards(JwtAuthGuard)
  poses(@Query('level') level?: YogaLevel, @Query('focus') focus?: YogaFocus) { return { count: this.library.list(level, focus).length, items: this.library.list(level, focus) }; }

  @Post('session') @UseGuards(JwtAuthGuard)
  session(@Body() body: { durationMin: number; level?: YogaLevel; focus?: YogaFocus; progress?: Record<string, unknown> }) { return this.generator.generate({ durationMin: body.durationMin, level: body.level, focus: body.focus, progress: body.progress }); }

  @Post('coach/start') @UseGuards(JwtAuthGuard)
  start(@Body() body: { session: YogaSession }) { return this.coach.start(body.session); }

  @Post('coach/tick') @UseGuards(JwtAuthGuard)
  tick(@Body() body: { session: YogaSession; state: YogaCoachState; elapsedSec?: number }) { return this.coach.tick(body.session, body.state, body.elapsedSec); }

  @Post('coach/cue') @UseGuards(JwtAuthGuard)
  cue(@Body() body: { state: YogaCoachState }) { return this.coach.cue(body.state); }
}
