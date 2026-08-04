import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '../../common/config/config.module';
import { AppConfigService } from '../../common/config/app-config/app-config.service';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [AppConfigService],
      useFactory: (appConfigService: AppConfigService) => ({
        secret: appConfigService.jwtSecret,
        signOptions: {
          expiresIn: appConfigService.jwtExpiresIn,
        },
      }),
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
