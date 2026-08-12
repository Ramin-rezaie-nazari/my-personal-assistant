import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateLifeTaskDto } from '../dto/create-life-task.dto';
import { TaskEventDto } from '../dto/task-event.dto';
import { UpdateLifeTaskDto } from '../dto/update-life-task.dto';
import { LifeTasksService } from '../services/life-tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class LifeTasksController {
  constructor(private readonly service: LifeTasksService) {}
  @Post() create(@Request() req:any,@Body() dto:CreateLifeTaskDto){return this.service.create(req.user.id,dto);}
  @Get() all(@Request() req:any,@Query('status') status?:string){return this.service.findAll(req.user.id,status);}
  @Get('next-best') next(@Request() req:any){return this.service.nextBest(req.user.id);}
  @Get(':id') one(@Request() req:any,@Param('id') id:string){return this.service.findOne(req.user.id,id);}
  @Patch(':id') update(@Request() req:any,@Param('id') id:string,@Body() dto:UpdateLifeTaskDto){return this.service.update(req.user.id,id,dto);}
  @Post(':id/events') event(@Request() req:any,@Param('id') id:string,@Body() dto:TaskEventDto){return this.service.event(req.user.id,id,dto);}
  @Post(':id/dependencies/:dependsOnTaskId') dependency(@Request() req:any,@Param('id') id:string,@Param('dependsOnTaskId') dependsOnTaskId:string){return this.service.addDependency(req.user.id,id,dependsOnTaskId);}
}
