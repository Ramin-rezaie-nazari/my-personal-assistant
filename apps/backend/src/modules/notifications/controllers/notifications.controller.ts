import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NotificationsService } from '../services/notifications.service';
import { SmartNotificationService } from '../services/smart-notification.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly smartNotificationService: SmartNotificationService,
  ) {}

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateNotificationDto) {
    return this.notificationsService.createNotification(req.user.id, dto);
  }

  @Post('generate')
  generate(@Request() req: { user: { id: string } }, @Query('dateKey') dateKey?: string) {
    return this.smartNotificationService.generateForUser(req.user.id, dateKey);
  }

  @Get()
  findAll(
    @Request() req: { user: { id: string } },
    @Query('includeRead') includeRead?: string,
  ) {
    return this.notificationsService.getNotifications(req.user.id, includeRead === 'true');
  }

  @Post(':id/read')
  markRead(@Request() req: { user: { id: string } }, @Param('id') notificationId: string) {
    return this.notificationsService.markRead(req.user.id, notificationId);
  }
}
