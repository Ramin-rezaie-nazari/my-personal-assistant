import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { ConfigModule } from './common/config/config.module';

@Module({
  imports: [HealthModule, ConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
