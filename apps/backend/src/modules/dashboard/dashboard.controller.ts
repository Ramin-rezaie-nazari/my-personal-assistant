import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('today')
  today(
    @Request() req: { user: { id: string } },
    @Query('dateKey') dateKey?: string,
  ) {
    return this.dashboardService.getToday(req.user.id, dateKey);
  }
}
