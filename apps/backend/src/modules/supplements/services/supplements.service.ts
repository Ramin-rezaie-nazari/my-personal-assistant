import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { getDateKeyInTimezone } from '../../../common/utils/user-time';
import { CreateSupplementDto, UpdateSupplementDto } from '../dto/supplement.dto';

@Injectable()
export class SupplementsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSupplement(userId: string, dto: CreateSupplementDto) {
    this.validate(dto.name, dto.scheduledTime);
    return this.prisma.supplement.create({ data: { userId, name: dto.name.trim(), dosage: dto.dosage?.trim() || null, frequency: dto.frequency?.trim() || 'daily', scheduledTime: dto.scheduledTime || '09:00' } });
  }

  async getSupplements(userId: string, includeInactive = false) {
    const dateKey = await this.todayKey(userId);
    return this.prisma.supplement.findMany({ where: { userId, ...(includeInactive ? {} : { active: true }) }, include: { logs: { where: { dateKey }, take: 1 } }, orderBy: [{ scheduledTime: 'asc' }, { name: 'asc' }] });
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

  async takeToday(userId: string, id: string, dateKey?: string) {
    const resolvedDateKey = dateKey ?? await this.todayKey(userId);
    const supplement = await this.prisma.supplement.findFirst({ where: { id, userId, active: true } });
    if (!supplement) throw new NotFoundException('Supplement not found');
    const log = await this.prisma.supplementLog.upsert({ where: { supplementId_dateKey: { supplementId: id, dateKey: resolvedDateKey } }, update: { takenAt: new Date() }, create: { userId, supplementId: id, dateKey: resolvedDateKey } });
    return { supplementId: id, dateKey: resolvedDateKey, taken: true, logId: log.id };
  }

  async getTodayStatus(userId: string, dateKey?: string) {
    const resolvedDateKey = dateKey ?? await this.todayKey(userId);
    const supplements = await this.prisma.supplement.findMany({ where: { userId, active: true }, include: { logs: { where: { dateKey: resolvedDateKey }, take: 1 } }, orderBy: { scheduledTime: 'asc' } });
    const taken = supplements.filter((item) => item.logs.length > 0).length;
    return { dateKey: resolvedDateKey, total: supplements.length, taken, remaining: Math.max(0, supplements.length - taken), completionPercent: supplements.length ? Math.round((taken / supplements.length) * 100) : 0, supplements };
  }

  private validate(name: string, time?: string) {
    if (!name?.trim()) throw new BadRequestException('name is required');
    if (time !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new BadRequestException('scheduledTime must use HH:MM');
  }

  private async todayKey(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({ where: { userId }, select: { timezone: true } });
    return getDateKeyInTimezone(new Date(), settings?.timezone || 'UTC');
  }
}
