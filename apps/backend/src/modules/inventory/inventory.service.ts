import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    return this.intelligence
      .prioritize(
        items.map((item) => ({
          productKey: item.foodId,
          quantity: item.quantity,
          unit: item.unit,
          dailyConsumption: item.dailyConsumption,
          safetyStock: item.safetyStock,
          essential: item.essential,
          expiresAt: item.expiresAt,
        })),
      )
      .map((forecast) => ({
        ...items.find((item) => item.foodId === forecast.productKey),
        ...forecast,
      }));
  }

  async create(userId: string, dto: CreateInventoryDto) {
    if (dto.quantity < 0)
      throw new BadRequestException('quantity cannot be negative');
    const food = await this.prisma.foodItem.findFirst({
      where: { id: dto.foodId, OR: [{ userId: null }, { userId }] },
    });
    if (!food) throw new NotFoundException('Food not found');
    const existing = await this.prisma.inventoryItem.findUnique({
      where: { userId_foodId: { userId, foodId: dto.foodId } },
    });
    const result = await this.prisma.inventoryItem.upsert({
      where: { userId_foodId: { userId, foodId: dto.foodId } },
      update: {
        quantity: dto.quantity,
        unit: dto.unit ?? 'g',
        dailyConsumption: dto.dailyConsumption ?? 0,
        safetyStock: dto.safetyStock ?? 0,
        essential: dto.essential ?? false,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      create: {
        userId,
        foodId: dto.foodId,
        quantity: dto.quantity,
        unit: dto.unit ?? 'g',
        dailyConsumption: dto.dailyConsumption ?? 0,
        safetyStock: dto.safetyStock ?? 0,
        essential: dto.essential ?? false,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: { food: true },
    });
    const delta = result.quantity - (existing?.quantity ?? 0);
    if (delta !== 0) {
      await this.appendEvent(userId, dto.foodId, delta > 0 ? 'purchase' : 'adjust', Math.abs(delta), result.unit, 'inventory-create');
    }
    return result;
  }

  async adjust(userId: string, id: string, quantity: number, source = 'adjustment') {
    if (quantity < 0)
      throw new BadRequestException('quantity cannot be negative');
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    const delta = quantity - item.quantity;
    const result = await this.prisma.inventoryItem.update({
      where: { id },
      data: { quantity },
      include: { food: true },
    });
    if (delta !== 0) {
      await this.appendEvent(userId, item.foodId, source, Math.abs(delta), item.unit, `inventory-${id}-${Date.now()}`);
    }
    return result;
  }

  async consume(userId: string, id: string, quantity: number, source = 'consume') {
    return this.decrement(userId, id, quantity, source, 'consume');
  }

  async waste(userId: string, id: string, quantity: number) {
    return this.decrement(userId, id, quantity, 'waste', 'waste');
  }

  async purchase(userId: string, id: string, quantity: number) {
    if (quantity <= 0) throw new BadRequestException('quantity must be positive');
    const item = await this.prisma.inventoryItem.findFirst({ where: { id, userId }, include: { food: true } });
    if (!item) throw new NotFoundException('Inventory item not found');
    const result = await this.prisma.inventoryItem.update({
      where: { id },
      data: { quantity: { increment: quantity } },
      include: { food: true },
    });
    await this.appendEvent(userId, item.foodId, 'purchase', quantity, item.unit, `purchase-${id}-${Date.now()}`);
    return result;
  }

  async remove(userId: string, id: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    await this.prisma.inventoryItem.delete({ where: { id } });
    return { deleted: true };
  }

  private async decrement(userId: string, id: string, quantity: number, source: string, eventType: string) {
    if (quantity <= 0) throw new BadRequestException('quantity must be positive');
    const item = await this.prisma.inventoryItem.findFirst({ where: { id, userId }, include: { food: true } });
    if (!item) throw new NotFoundException('Inventory item not found');
    if (quantity > item.quantity) throw new BadRequestException('quantity exceeds current inventory');
    const result = await this.prisma.inventoryItem.update({
      where: { id },
      data: { quantity: { decrement: quantity } },
      include: { food: true },
    });
    await this.appendEvent(userId, item.foodId, eventType, quantity, item.unit, `${source}-${id}-${Date.now()}`);
    return result;
  }

  private appendEvent(userId: string, foodId: string, type: string, quantity: number, unit: string, idempotencyKey: string) {
    return this.prisma.inventoryEvent.create({
      data: {
        userId,
        foodId,
        type,
        quantity,
        unit,
        source: type,
        idempotencyKey,
      },
    });
  }
}
