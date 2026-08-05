import { Module } from '@nestjs/common';
import { SupplementsController } from './controllers/supplements.controller';
import { SupplementsService } from './services/supplements.service';

@Module({
  controllers: [SupplementsController],
  providers: [SupplementsService],
  exports: [SupplementsService],
})
export class SupplementsModule {}
