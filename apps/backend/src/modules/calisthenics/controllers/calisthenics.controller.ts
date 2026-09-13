import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Equipment } from '../models/calisthenics.model';
import type { CalisthenicsFocus, CalisthenicsLevel } from '../models/calisthenics.model';
import { CalisthenicsLibraryService } from '../services/calisthenics-library.service';
import { CalisthenicsSessionGeneratorService } from '../services/calisthenics-session-generator.service';
import { CalisthenicsCoachService } from '../services/calisthenics-coach.service';
import { CalisthenicsSessionDto, CalisthenicsSessionInputDto, CalisthenicsTickDto } from '../dto/calisthenics.dto';

@Controller('calisthenics')
export class CalisthenicsController {
  constructor(
    private readonly library: CalisthenicsLibraryService,
    private readonly generator: CalisthenicsSessionGeneratorService,
    private readonly coach: CalisthenicsCoachService,
  ) {}

  @Get('exercises')
  @UseGuards(JwtAuthGuard)
  exercises(
    @Query('level') level?: CalisthenicsLevel,
    @Query('focus') focus?: CalisthenicsFocus,
    @Query('equipment') equipmentCsv?: string,
  ) {
    const equipment = equipmentCsv?.split(',').filter(Boolean) as Equipment[] | undefined;
    const items = this.library.list(level, focus, equipment?.length ? equipment : ['none']);
    return { count: items.length, items };
  }

  @Post('session')
  @UseGuards(JwtAuthGuard)
  session(@Body() body: CalisthenicsSessionDto) {
    return this.generator.generate(body);
  }

  @Post('coach/start')
  @UseGuards(JwtAuthGuard)
  start(@Body() body: CalisthenicsSessionInputDto) {
    return this.coach.start(body.session as any);
  }

  @Post('coach/tick')
  @UseGuards(JwtAuthGuard)
  tick(@Body() body: CalisthenicsTickDto) {
    return this.coach.tick(body.session as any, body.state as any, body.elapsedSec);
  }
}
