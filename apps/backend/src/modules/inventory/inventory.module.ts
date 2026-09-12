import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { HouseholdInventoryIntelligenceService } from './household-inventory-intelligence.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, HouseholdInventoryIntelligenceService],
  exports: [InventoryService, HouseholdInventoryIntelligenceService],
})
export class InventoryModule {}
