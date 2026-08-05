import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/database/prisma.module';
import { PreferencesController } from './controllers/preferences.controller';
import { PreferencesService } from './services/preferences.service';

@Module({
  imports: [PrismaModule],
  controllers: [PreferencesController],
  providers: [PreferencesService],
})
export class PreferencesModule {}
