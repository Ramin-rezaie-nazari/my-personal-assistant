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
    },
    {
      secret: appConfigService.jwtRefreshSecret,
      expiresIn:
        appConfigService.jwtRefreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`,
    },
  );
}
