import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEV_ACCESS_SECRET = 'development-access-secret';
const DEV_REFRESH_SECRET = 'development-refresh-secret';

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
    return this.getRequiredSecret('JWT_ACCESS_SECRET', DEV_ACCESS_SECRET);
  }

  get jwtAccessExpiresIn(): string {
    const value = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN');
    return value ?? '15m';
  }

  get jwtRefreshSecret(): string {
    return this.getRequiredSecret('JWT_REFRESH_SECRET', DEV_REFRESH_SECRET);
  }

  get jwtRefreshExpiresIn(): string {
    const value = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN');
    return value ?? '30d';
  }

  private getRequiredSecret(name: string, developmentFallback: string): string {
    const value = this.configService.get<string>(name);
    if (value) return value;
    if (this.nodeEnv === 'development' || this.nodeEnv === 'test') {
      return developmentFallback;
    }
    throw new Error(`${name} must be configured outside development/test environments`);
  }
}
