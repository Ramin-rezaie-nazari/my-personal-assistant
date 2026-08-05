import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { AssistantController } from './controllers/assistant.controller';
import { AssistantService } from './services/assistant.service';

@Module({
  imports: [PrismaModule],
  controllers: [AssistantController],
  providers: [AssistantService],
  exports: [AssistantService],
})
export class AssistantModule {}
