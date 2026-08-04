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

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET', 'development-secret');
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '15m');
  }
}
