import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateSupplementDto, UpdateSupplementDto } from '../dto/supplement.dto';
import { SupplementsService } from '../services/supplements.service';

@Controller('supplements')
@UseGuards(JwtAuthGuard)
export class SupplementsController {
  constructor(private readonly supplementsService: SupplementsService) {}

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateSupplementDto) {
    return this.supplementsService.createSupplement(req.user.id, dto);
  }

  @Get()
  list(@Request() req: { user: { id: string } }, @Query('includeInactive') includeInactive?: string) {
    return this.supplementsService.getSupplements(req.user.id, includeInactive === 'true');
  }

  @Get('today')
  today(@Request() req: { user: { id: string } }, @Query('dateKey') dateKey?: string) {
    return this.supplementsService.getTodayStatus(req.user.id, dateKey);
  }

  @Post(':id/take')
  take(@Request() req: { user: { id: string } }, @Param('id') id: string, @Query('dateKey') dateKey?: string) {
    return this.supplementsService.takeToday(req.user.id, id, dateKey);
  }

  @Patch(':id')
  update(@Request() req: { user: { id: string } }, @Param('id') id: string, @Body() dto: UpdateSupplementDto) {
    return this.supplementsService.updateSupplement(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.supplementsService.deleteSupplement(req.user.id, id);
  }
}
