import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { HouseholdInventoryIntelligenceService } from '../shopping-intelligence/services/household-inventory-intelligence.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly intelligence: HouseholdInventoryIntelligenceService,
  ) {}

  async list(userId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { userId },
      include: { food: true },
      orderBy: [{ essential: 'desc' }, { updatedAt: 'desc' }],
    });
    return this.intelligence.prioritize(items.map((item) => ({
      productKey: item.foodId,
      quantity: item.quantity,
      unit: item.unit,
      dailyConsumption: item.dailyConsumption,
      safetyStock: item.safetyStock,
      essential: item.essential,
    }))).map((forecast) => ({
      ...items.find((item) => item.foodId === forecast.productKey),
      ...forecast,
    }));
  }

  async create(userId: string, dto: CreateInventoryDto) {
    if (dto.quantity < 0) throw new BadRequestException('quantity cannot be negative');
    const food = await this.prisma.foodItem.findFirst({ where: { id: dto.foodId, OR: [{ userId: null }, { userId }] } });
    if (!food) throw new NotFoundException('Food not found');
    return this.prisma.inventoryItem.upsert({
      where: { userId_foodId: { userId, foodId: dto.foodId } },
      update: { quantity: dto.quantity, unit: dto.unit ?? 'g', dailyConsumption: dto.dailyConsumption ?? 0, safetyStock: dto.safetyStock ?? 0, essential: dto.essential ?? false, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null },
      create: { userId, foodId: dto.foodId, quantity: dto.quantity, unit: dto.unit ?? 'g', dailyConsumption: dto.dailyConsumption ?? 0, safetyStock: dto.safetyStock ?? 0, essential: dto.essential ?? false, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null },
      include: { food: true },
    });
  }

  async adjust(userId: string, id: string, quantity: number) {
    if (quantity < 0) throw new BadRequestException('quantity cannot be negative');
    const item = await this.prisma.inventoryItem.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Inventory item not found');
    return this.prisma.inventoryItem.update({ where: { id }, data: { quantity }, include: { food: true } });
  }

  async remove(userId: string, id: string) {
    const item = await this.prisma.inventoryItem.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Inventory item not found');
    await this.prisma.inventoryItem.delete({ where: { id } });
    return { deleted: true };
  }
}
