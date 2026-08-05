import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PreferencesService } from '../services/preferences.service';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto';

@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  get(@Request() req: { user: { id: string } }) {
    return this.preferencesService.getPreferences(req.user.id);
  }

  @Patch()
  update(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.preferencesService.updatePreferences(req.user.id, {
      onboardingCompleted: dto.onboardingCompleted,
      notificationsEnabled: dto.notificationsEnabled,
      reminderEnabled: dto.reminderEnabled,
      theme: dto.theme,
    });
  }
}
