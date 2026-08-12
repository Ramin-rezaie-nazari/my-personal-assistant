import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateTaskDto, TaskEventDto, UpdateTaskDto } from '../dto/task.dto';
import { LifeExecutionService } from '../services/life-execution.service';

@Controller('life/tasks')
@UseGuards(JwtAuthGuard)
export class LifeExecutionController {
  constructor(private readonly service: LifeExecutionService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateTaskDto) { return this.service.create(req.user.id, dto); }

  @Get()
  list(@Request() req: any, @Query('status') status?: string) { return this.service.list(req.user.id, status); }

  @Get('next-best')
  nextBest(@Request() req: any) { return this.service.nextBest(req.user.id); }

  @Get(':id')
  one(@Request() req: any, @Param('id') id: string) { return this.service.one(req.user.id, id); }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateTaskDto) { return this.service.update(req.user.id, id, dto); }

  @Post(':id/events')
  event(@Request() req: any, @Param('id') id: string, @Body() dto: TaskEventDto) { return this.service.recordEvent(req.user.id, id, dto); }
}
