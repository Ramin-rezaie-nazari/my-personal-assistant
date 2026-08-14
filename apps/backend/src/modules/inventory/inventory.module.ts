import { Module } from '@nestjs/common';
import { ShoppingIntelligenceModule } from '../shopping-intelligence/shopping-intelligence.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [ShoppingIntelligenceModule],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
