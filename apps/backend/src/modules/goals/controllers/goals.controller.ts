import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CheckinGoalDto } from '../dto/checkin-goal.dto';
import { CreateGoalDto } from '../dto/create-goal.dto';
import { UpdateGoalDto } from '../dto/update-goal.dto';
import { GoalsService } from '../services/goals.service';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(req.user.id, dto);
  }

  @Get()
  findAll(
    @Request() req: { user: { id: string } },
    @Query('status') status?: string,
  ) {
    return this.goalsService.findAll(req.user.id, status);
  }

  @Get(':id')
  findOne(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.goalsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.update(req.user.id, id, dto);
  }

  @Post(':id/checkin')
  checkin(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: CheckinGoalDto,
  ) {
    return this.goalsService.checkin(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.goalsService.remove(req.user.id, id);
  }
}
