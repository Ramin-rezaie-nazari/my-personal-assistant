import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SettingsService } from '../services/settings.service';
import { UpdateSettingsDto } from '../dto/update-settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  get(@Request() req: { user: { id: string } }) {
    return this.settingsService.getSettings(req.user.id);
  }

  @Patch()
  update(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(req.user.id, dto);
  }
}
