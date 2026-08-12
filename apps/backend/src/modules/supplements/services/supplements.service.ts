import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { CreateSupplementDto, UpdateSupplementDto } from '../dto/supplement.dto';

@Injectable()
export class SupplementsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSupplement(userId: string, dto: CreateSupplementDto) {
    this.validate(dto.name, dto.scheduledTime);
    return this.prisma.supplement.create({
      data: {
        userId,
        name: dto.name.trim(),
        dosage: dto.dosage?.trim() || null,
        frequency: dto.frequency?.trim() || 'daily',
        scheduledTime: dto.scheduledTime || '09:00',
      },
    });
  }

  async getSupplements(userId: string, includeInactive = false) {
    return this.prisma.supplement.findMany({
      where: { userId, ...(includeInactive ? {} : { active: true }) },
      include: { logs: { where: { dateKey: this.todayKey() }, take: 1 } },
      orderBy: [{ scheduledTime: 'asc' }, { name: 'asc' }],
    });
  }

  async updateSupplement(userId: string, id: string, dto: UpdateSupplementDto) {
    const existing = await this.prisma.supplement.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Supplement not found');
    if (dto.name !== undefined && !dto.name.trim()) throw new BadRequestException('name is required');
    if (dto.scheduledTime !== undefined) this.validate(existing.name, dto.scheduledTime);
    return this.prisma.supplement.update({ where: { id }, data: { ...dto, name: dto.name?.trim(), dosage: dto.dosage?.trim() } });
  }

  async deleteSupplement(userId: string, id: string) {
    const existing = await this.prisma.supplement.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Supplement not found');
    await this.prisma.supplement.delete({ where: { id } });
    return { deleted: true };
  }

  async takeToday(userId: string, id: string, dateKey = this.todayKey()) {
    const supplement = await this.prisma.supplement.findFirst({ where: { id, userId, active: true } });
    if (!supplement) throw new NotFoundException('Supplement not found');
    const log = await this.prisma.supplementLog.upsert({
      where: { supplementId_dateKey: { supplementId: id, dateKey } },
      update: { takenAt: new Date() },
      create: { userId, supplementId: id, dateKey },
    });
    return { supplementId: id, dateKey, taken: true, logId: log.id };
  }

  async getTodayStatus(userId: string, dateKey = this.todayKey()) {
    const supplements = await this.prisma.supplement.findMany({
      where: { userId, active: true },
      include: { logs: { where: { dateKey }, take: 1 } },
      orderBy: { scheduledTime: 'asc' },
    });
    const taken = supplements.filter((item) => item.logs.length > 0).length;
    return { dateKey, total: supplements.length, taken, remaining: Math.max(0, supplements.length - taken), completionPercent: supplements.length ? Math.round((taken / supplements.length) * 100) : 0, supplements };
  }

  private validate(name: string, time?: string) {
    if (!name?.trim()) throw new BadRequestException('name is required');
    if (time !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new BadRequestException('scheduledTime must use HH:MM');
  }

  private todayKey() { return new Date().toISOString().slice(0, 10); }
}
