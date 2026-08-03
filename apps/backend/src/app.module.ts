import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { ConfigModule } from './common/config/config.module';
import { PrismaModule } from './common/database/prisma.module';

@Module({
  imports: [HealthModule, ConfigModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
