import { Controller, Get, Post } from '@nestjs/common';
import { SupplementsService } from '../services/supplements.service';

@Controller('supplements')
export class SupplementsController {
  constructor(private readonly supplementsService: SupplementsService) {}

  @Post()
  createSupplement() {
    return this.supplementsService.createSupplement();
  }

  @Get()
  getSupplements() {
    return this.supplementsService.getSupplements();
  }
}
