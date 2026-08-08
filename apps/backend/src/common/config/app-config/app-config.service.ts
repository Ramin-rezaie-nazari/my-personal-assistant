import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get appName(): string {
    return this.configService.get<string>(
      'APP_NAME',
      'My Personal Assistant API',
    );
  }

  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL', '');
  }

  get jwtAccessSecret(): string {
    return this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'development-access-secret',
    );
  }

  get jwtAccessExpiresIn(): string {
    const value = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN');

    return value ?? '15m';
  }

  get jwtRefreshSecret(): string {
    return this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'development-refresh-secret',
    );
  }

  get jwtRefreshExpiresIn(): string {
    const value = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN');

    return value ?? '30d';
  }
}
