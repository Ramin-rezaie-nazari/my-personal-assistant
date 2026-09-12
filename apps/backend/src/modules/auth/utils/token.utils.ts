import { randomUUID } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../../../common/config/app-config/app-config.service';

export function createAccessToken(
  jwtService: JwtService,
  appConfigService: AppConfigService,
  userId: string,
) {
  return jwtService.sign(
    {
      sub: userId,
      jti: randomUUID(),
    },
    {
      secret: appConfigService.jwtAccessSecret,
      expiresIn:
        appConfigService.jwtAccessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`,
    },
  );
}

export function createRefreshToken(
  jwtService: JwtService,
  appConfigService: AppConfigService,
  userId: string,
) {
  return jwtService.sign(
    {
      sub: userId,
      type: 'refresh',
      jti: randomUUID(),
    },
    {
      secret: appConfigService.jwtRefreshSecret,
      expiresIn:
        appConfigService.jwtRefreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`,
    },
  );
}
