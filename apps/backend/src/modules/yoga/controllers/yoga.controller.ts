import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { YogaFocus, YogaLevel } from '../models/yoga.model';
import { YogaCoachService } from '../services/yoga-coach.service';
import { YogaLibraryService } from '../services/yoga-library.service';
import { YogaSessionGeneratorService } from '../services/yoga-session-generator.service';
import { YogaMotionAnalysisService } from '../services/yoga-motion-analysis.service';
import { YogaSessionDto, YogaSessionInputDto, YogaTickDto, YogaCueDto, YogaMotionDto } from '../dto/yoga.dto';

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
  session(@Body() body: YogaSessionDto) {
    return this.generator.generate(body);
  }

  @Post('coach/start')
  @UseGuards(JwtAuthGuard)
  start(@Body() body: YogaSessionInputDto) {
    return this.coach.start(body.session);
  }

  @Post('coach/tick')
  @UseGuards(JwtAuthGuard)
  tick(@Body() body: YogaTickDto) {
    return this.coach.tick(body.session, body.state, body.elapsedSec);
  }

  @Post('coach/cue')
  @UseGuards(JwtAuthGuard)
  cue(@Body() body: YogaCueDto) {
    return this.coach.cue(body.state);
  }

  @Post('motion/analyze')
  @UseGuards(JwtAuthGuard)
  analyzeMotion(@Body() body: YogaMotionDto) {
    const result = this.motion.analyze(body.poseId, body.frame);
    if (result.confidence < 0.55) {
      return { ...result, coachReady: false, reason: 'low_pose_confidence' };
    }
    return { ...result, coachReady: true };
  }
}
