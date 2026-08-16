import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { YogaSession } from '../models/yoga.model';
import type { YogaFocus, YogaLevel } from '../models/yoga.model';
import {
  YogaCoachService,
  YogaCoachState,
} from '../services/yoga-coach.service';
import { YogaLibraryService } from '../services/yoga-library.service';
import { YogaSessionGeneratorService } from '../services/yoga-session-generator.service';
import { YogaMotionAnalysisService } from '../services/yoga-motion-analysis.service';
import { PoseFrame } from '../models/pose-provider.model';

@Controller('yoga')
export class YogaController {
  constructor(
    private readonly library: YogaLibraryService,
    private readonly generator: YogaSessionGeneratorService,
    private readonly coach: YogaCoachService,
    private readonly motion: YogaMotionAnalysisService,
  ) {}

  @Get('poses')
  @UseGuards(JwtAuthGuard)
  poses(@Query('level') level?: YogaLevel, @Query('focus') focus?: YogaFocus) {
    const items = this.library.list(level, focus);
    return { count: items.length, items };
  }

  @Post('session')
  @UseGuards(JwtAuthGuard)
  session(
    @Body()
    body: {
      durationMin: number;
      level?: YogaLevel;
      focus?: YogaFocus;
      progress?: Record<string, unknown>;
    },
  ) {
    return this.generator.generate({
      durationMin: body.durationMin,
      level: body.level,
      focus: body.focus,
      progress: body.progress,
    });
  }

  @Post('coach/start')
  @UseGuards(JwtAuthGuard)
  start(@Body() body: { session: YogaSession }) {
    return this.coach.start(body.session);
  }

  @Post('coach/tick')
  @UseGuards(JwtAuthGuard)
  tick(
    @Body()
    body: {
      session: YogaSession;
      state: YogaCoachState;
      elapsedSec?: number;
    },
  ) {
    return this.coach.tick(body.session, body.state, body.elapsedSec);
  }

  @Post('coach/cue')
  @UseGuards(JwtAuthGuard)
  cue(@Body() body: { state: YogaCoachState }) {
    return this.coach.cue(body.state);
  }

  @Post('motion/analyze')
  @UseGuards(JwtAuthGuard)
  analyzeMotion(@Body() body: { poseId: string; frame: PoseFrame }) {
    const result = this.motion.analyze(body.poseId, body.frame);
    if (result.confidence < 0.55)
      return { ...result, coachReady: false, reason: 'low_pose_confidence' };
    return { ...result, coachReady: true };
  }
}
