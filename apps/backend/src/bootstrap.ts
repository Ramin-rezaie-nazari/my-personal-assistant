import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './common/config/app-config/app-config.service';

export async function createApp() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  return app;
}

export async function bootstrap() {
  const app = await createApp();
  const configService = app.get(AppConfigService);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(configService.port, host);
  return app;
}
