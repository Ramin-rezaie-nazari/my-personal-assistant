import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DailyCommandCenterService } from './daily-command-center.service';

@Controller('daily-command-center')
@UseGuards(JwtAuthGuard)
export class DailyCommandCenterController {
  constructor(private readonly service: DailyCommandCenterService) {}

  @Get()
  getToday(@Request() req: { user: { id: string } }) {
    return this.service.getToday(req.user.id);
  }
}
