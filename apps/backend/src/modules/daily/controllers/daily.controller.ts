import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DailyService } from '../services/daily.service';
import { UpdateDailyDto } from '../dto/update-daily.dto';

@Controller('daily')
@UseGuards(JwtAuthGuard)
export class DailyController {
  constructor(private readonly dailyService: DailyService) {}

  @Get()
  get(@Request() req: { user: { id: string } }) {
    return this.dailyService.getDailyLog(req.user.id);
  }

  @Patch()
  update(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateDailyDto,
  ) {
    return this.dailyService.updateDailyLog(req.user.id, dto);
  }
}
