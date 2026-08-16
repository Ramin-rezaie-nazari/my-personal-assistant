import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  list(@Request() req: { user: { id: string } }) {
    return this.inventory.list(req.user.id);
  }

  @Post()
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateInventoryDto,
  ) {
    return this.inventory.create(req.user.id, dto);
  }

  @Patch(':id')
  adjust(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.inventory.adjust(req.user.id, id, quantity);
  }

  @Delete(':id')
  remove(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.inventory.remove(req.user.id, id);
  }
}
