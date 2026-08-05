import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/database/prisma.module';
import { UsersService } from './users.service';
import { UsersController } from './controllers/users.controller';

@Module({
  imports: [PrismaModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
