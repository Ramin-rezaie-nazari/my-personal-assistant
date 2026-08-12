import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../common/database/prisma.service';
import { CheckinGoalDto } from '../dto/checkin-goal.dto';
import { CreateGoalDto } from '../dto/create-goal.dto';
import { UpdateGoalDto } from '../dto/update-goal.dto';

type GoalRow = {
  id: string; userId: string; title: string; description: string | null; category: string;
  status: string; priority: number; targetDate: Date | null; progressPercent: number;
  targetValue: number | null; currentValue: number | null; unit: string | null;
  createdAt: Date; updatedAt: Date;
};

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateGoalDto) {
    this.validateTitle(dto.title);
    const priority = dto.priority ?? 2;
    this.validatePriority(priority);
    const targetDate = this.parseDate(dto.targetDate);
    const id = randomUUID();
    await this.prisma.$executeRaw`INSERT INTO "Goal" ("id","userId","title","description","category","priority","targetDate","targetValue","currentValue","unit") VALUES (${id},${userId},${dto.title.trim()},${dto.description?.trim() ?? null},${dto.category?.trim() || 'general'},${priority},${targetDate},${dto.targetValue ?? null},${dto.currentValue ?? null},${dto.unit?.trim() || null})`;
    return this.findOne(userId, id);
  }

  async findAll(userId: string, status?: string) {
    const rows = await this.prisma.$queryRaw<GoalRow[]>`SELECT * FROM "Goal" WHERE "userId" = ${userId} ${status ? this.prisma.$queryRaw`AND "status" = ${status}` : this.prisma.$queryRaw``} ORDER BY CASE WHEN "status" = 'active' THEN 0 ELSE 1 END, "priority" ASC, "targetDate" ASC NULLS LAST, "createdAt" DESC`;
    return rows;
  }

  async findOne(userId: string, id: string) {
    const rows = await this.prisma.$queryRaw<GoalRow[]>`SELECT * FROM "Goal" WHERE "id" = ${id} AND "userId" = ${userId} LIMIT 1`;
    if (!rows[0]) throw new NotFoundException('Goal not found');
    const checkins = await this.prisma.$queryRaw`SELECT "id","dateKey","progressPercent","note","createdAt" FROM "GoalCheckin" WHERE "goalId" = ${id} ORDER BY "dateKey" DESC LIMIT 14`;
    return { ...rows[0], checkins };
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    const existing = await this.getRaw(userId, id);
    if (!existing) throw new NotFoundException('Goal not found');
    if (dto.title !== undefined) this.validateTitle(dto.title);
    if (dto.priority !== undefined) this.validatePriority(dto.priority);
    if (dto.progressPercent !== undefined) this.validateProgress(dto.progressPercent);
    if (dto.status !== undefined && !['active', 'completed', 'paused'].includes(dto.status)) throw new BadRequestException('Invalid goal status');
    const targetDate = dto.targetDate === undefined ? existing.targetDate : this.parseDate(dto.targetDate);
    const progress = dto.progressPercent ?? existing.progressPercent;
    const status = dto.status ?? (progress >= 100 ? 'completed' : existing.status);
    await this.prisma.$executeRaw`UPDATE "Goal" SET "title"=${dto.title?.trim() ?? existing.title}, "description"=${dto.description === undefined ? existing.description : dto.description?.trim() || null}, "category"=${dto.category === undefined ? existing.category : dto.category.trim() || 'general'}, "status"=${status}, "priority"=${dto.priority ?? existing.priority}, "targetDate"=${targetDate}, "progressPercent"=${progress}, "targetValue"=${dto.targetValue === undefined ? existing.targetValue : dto.targetValue}, "currentValue"=${dto.currentValue === undefined ? existing.currentValue : dto.currentValue}, "unit"=${dto.unit === undefined ? existing.unit : dto.unit?.trim() || null}, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${id} AND "userId"=${userId}`;
    return this.findOne(userId, id);
  }

  async checkin(userId: string, id: string, dto: CheckinGoalDto) {
    const existing = await this.getRaw(userId, id);
    if (!existing) throw new NotFoundException('Goal not found');
    this.validateProgress(dto.progressPercent);
    const dateKey = dto.dateKey ?? new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new BadRequestException('dateKey must use YYYY-MM-DD format');
    await this.prisma.$executeRaw`INSERT INTO "GoalCheckin" ("id","goalId","dateKey","progressPercent","note") VALUES (${randomUUID()},${id},${dateKey},${dto.progressPercent},${dto.note?.trim() || null}) ON CONFLICT ("goalId","dateKey") DO UPDATE SET "progressPercent"=EXCLUDED."progressPercent", "note"=EXCLUDED."note", "createdAt"=CURRENT_TIMESTAMP`;
    await this.prisma.$executeRaw`UPDATE "Goal" SET "progressPercent"=${dto.progressPercent}, "status"=${dto.progressPercent >= 100 ? 'completed' : 'active'}, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${id} AND "userId"=${userId}`;
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    const existing = await this.getRaw(userId, id);
    if (!existing) throw new NotFoundException('Goal not found');
    await this.prisma.$executeRaw`DELETE FROM "Goal" WHERE "id"=${id} AND "userId"=${userId}`;
    return { deleted: true };
  }

  private async getRaw(userId: string, id: string) {
    const rows = await this.prisma.$queryRaw<GoalRow[]>`SELECT * FROM "Goal" WHERE "id"=${id} AND "userId"=${userId} LIMIT 1`;
    return rows[0];
  }
  private validateTitle(value?: string) { if (!value?.trim()) throw new BadRequestException('Goal title is required'); }
  private validatePriority(value: number) { if (!Number.isInteger(value) || value < 1 || value > 3) throw new BadRequestException('priority must be between 1 and 3'); }
  private validateProgress(value: number) { if (!Number.isInteger(value) || value < 0 || value > 100) throw new BadRequestException('progressPercent must be between 0 and 100'); }
  private parseDate(value?: string | null) { if (!value) return null; const date = new Date(value); if (Number.isNaN(date.getTime())) throw new BadRequestException('targetDate must be a valid date'); return date; }
}
