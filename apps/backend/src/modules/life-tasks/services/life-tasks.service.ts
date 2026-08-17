import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../common/database/prisma.service';
import { CreateLifeTaskDto } from '../dto/create-life-task.dto';
import { TaskEventDto } from '../dto/task-event.dto';
import { UpdateLifeTaskDto } from '../dto/update-life-task.dto';

type LifeTaskRow = {
  id: string;
  userId: string;
  goalId: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  estimatedMinutes: number;
  energyLevel: string;
  dueAt: Date | null;
  scheduledAt: Date | null;
  completedAt: Date | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
};

type LifeTaskDependencyRow = {
  id: string;
  dependsOnTaskId: string;
  title: string;
  status: string;
};

type LifeTaskEventRow = {
  id: string;
  eventType: string;
  reason: string | null;
  metadata: unknown;
  createdAt: Date;
};

type DependencyCycleRow = { exists: boolean };

@Injectable()
export class LifeTasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateLifeTaskDto) {
    this.validateTitle(dto.title);
    this.validatePriority(dto.priority ?? 2);
    this.validateMinutes(dto.estimatedMinutes ?? 15);
    const id = randomUUID();
    if (dto.goalId) await this.assertGoal(userId, dto.goalId);
    await this.prisma
      .$executeRaw`INSERT INTO "LifeTask" ("id","userId","goalId","title","description","priority","estimatedMinutes","energyLevel","dueAt","scheduledAt","source") VALUES (${id},${userId},${dto.goalId ?? null},${dto.title.trim()},${dto.description?.trim() ?? null},${dto.priority ?? 2},${dto.estimatedMinutes ?? 15},${dto.energyLevel ?? 'medium'},${this.date(dto.dueAt)},${this.date(dto.scheduledAt)},${dto.source ?? 'user'})`;
    return this.findOne(userId, id);
  }

  async findAll(userId: string, status?: string) {
    if (
      status &&
      !['pending', 'in_progress', 'completed', 'cancelled', 'snoozed'].includes(
        status,
      )
    )
      throw new BadRequestException('Invalid task status');
    if (status)
      return this.prisma.$queryRaw<LifeTaskRow[]>`
        SELECT * FROM "LifeTask"
        WHERE "userId"=${userId} AND "status"=${status}
        ORDER BY "priority" ASC,"dueAt" ASC NULLS LAST,"createdAt" DESC`;
    return this.prisma.$queryRaw<LifeTaskRow[]>`
      SELECT * FROM "LifeTask"
      WHERE "userId"=${userId}
      ORDER BY CASE WHEN "status"='completed' THEN 1 ELSE 0 END,"priority" ASC,"dueAt" ASC NULLS LAST,"createdAt" DESC`;
  }

  async findOne(userId: string, id: string) {
    const task = await this.getTask(userId, id);
    if (!task) throw new NotFoundException('Task not found');
    const [dependencies, events] = await Promise.all([
      this.prisma.$queryRaw<LifeTaskDependencyRow[]>`
        SELECT d."id",d."dependsOnTaskId",t."title",t."status"
        FROM "LifeTaskDependency" d
        JOIN "LifeTask" t ON t."id"=d."dependsOnTaskId"
        WHERE d."taskId"=${id}`,
      this.prisma.$queryRaw<LifeTaskEventRow[]>`
        SELECT "id","eventType","reason","metadata","createdAt"
        FROM "LifeTaskEvent"
        WHERE "taskId"=${id}
        ORDER BY "createdAt" DESC LIMIT 30`,
    ]);
    return { ...task, dependencies, events };
  }

  async update(userId: string, id: string, dto: UpdateLifeTaskDto) {
    const task = await this.getTask(userId, id);
    if (!task) throw new NotFoundException('Task not found');
    if (dto.title !== undefined) this.validateTitle(dto.title);
    if (dto.priority !== undefined) this.validatePriority(dto.priority);
    if (dto.estimatedMinutes !== undefined)
      this.validateMinutes(dto.estimatedMinutes);
    if (
      dto.status &&
      !['pending', 'in_progress', 'completed', 'cancelled', 'snoozed'].includes(
        dto.status,
      )
    )
      throw new BadRequestException('Invalid task status');
    const status = dto.status ?? task.status;
    const completedAt =
      status === 'completed'
        ? new Date()
        : dto.status === undefined
          ? task.completedAt
          : null;
    await this.prisma
      .$executeRaw`UPDATE "LifeTask" SET "title"=${dto.title?.trim() ?? task.title},"description"=${dto.description === undefined ? task.description : dto.description?.trim() || null},"status"=${status},"priority"=${dto.priority ?? task.priority},"estimatedMinutes"=${dto.estimatedMinutes ?? task.estimatedMinutes},"energyLevel"=${dto.energyLevel ?? task.energyLevel},"dueAt"=${dto.dueAt === undefined ? task.dueAt : this.date(dto.dueAt)},"scheduledAt"=${dto.scheduledAt === undefined ? task.scheduledAt : this.date(dto.scheduledAt)},"completedAt"=${completedAt},"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${id} AND "userId"=${userId}`;
    if (dto.status)
      await this.recordEvent(userId, id, {
        eventType:
          dto.status === 'completed'
            ? 'completed'
            : dto.status === 'snoozed'
              ? 'snoozed'
              : dto.status === 'cancelled'
                ? 'cancelled'
                : dto.status === 'in_progress'
                  ? 'started'
                  : 'skipped',
      });
    return this.findOne(userId, id);
  }

  async event(userId: string, id: string, dto: TaskEventDto) {
    const task = await this.getTask(userId, id);
    if (!task) throw new NotFoundException('Task not found');
    await this.recordEvent(userId, id, dto);
    const status =
      dto.eventType === 'completed'
        ? 'completed'
        : dto.eventType === 'started'
          ? 'in_progress'
          : dto.eventType === 'snoozed'
            ? 'snoozed'
            : dto.eventType === 'cancelled'
              ? 'cancelled'
              : task.status;
    await this.prisma
      .$executeRaw`UPDATE "LifeTask" SET "status"=${status},"completedAt"=${dto.eventType === 'completed' ? new Date() : null},"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${id} AND "userId"=${userId}`;
    return this.findOne(userId, id);
  }

  async addDependency(userId: string, id: string, dependsOnTaskId: string) {
    const [task, dependency] = await Promise.all([
      this.getTask(userId, id),
      this.getTask(userId, dependsOnTaskId),
    ]);
    if (!task || !dependency) throw new NotFoundException('Task not found');
    if (id === dependsOnTaskId)
      throw new BadRequestException('A task cannot depend on itself');
    const cycle = await this.prisma.$queryRaw<DependencyCycleRow[]>`
      WITH RECURSIVE chain AS (
        SELECT "dependsOnTaskId" FROM "LifeTaskDependency" WHERE "taskId"=${dependsOnTaskId}
        UNION
        SELECT d."dependsOnTaskId"
        FROM "LifeTaskDependency" d
        JOIN chain c ON c."dependsOnTaskId"=d."taskId"
      )
      SELECT EXISTS(SELECT 1 FROM chain WHERE "dependsOnTaskId"=${id}) AS exists`;
    if (cycle[0]?.exists)
      throw new BadRequestException('Dependency would create a cycle');
    await this.prisma
      .$executeRaw`INSERT INTO "LifeTaskDependency" ("id","taskId","dependsOnTaskId") VALUES (${randomUUID()},${id},${dependsOnTaskId}) ON CONFLICT ("taskId","dependsOnTaskId") DO NOTHING`;
    return this.findOne(userId, id);
  }

  async nextBest(userId: string) {
    const rows = await this.prisma.$queryRaw<LifeTaskRow[]>`
      SELECT t.* FROM "LifeTask" t
      WHERE t."userId"=${userId}
        AND t."status" IN ('pending','in_progress')
        AND NOT EXISTS (
          SELECT 1 FROM "LifeTaskDependency" d
          JOIN "LifeTask" dep ON dep."id"=d."dependsOnTaskId"
          WHERE d."taskId"=t."id" AND dep."status" <> 'completed'
        )
      ORDER BY (
        CASE WHEN t."dueAt" IS NOT NULL AND t."dueAt" < CURRENT_TIMESTAMP THEN 100 ELSE 0 END
        + (3-t."priority")*20
        + CASE WHEN t."dueAt" IS NOT NULL AND t."dueAt" < CURRENT_TIMESTAMP + INTERVAL '24 hours' THEN 40 ELSE 0 END
        + CASE WHEN t."status"='in_progress' THEN 15 ELSE 0 END
      ) DESC,t."createdAt" ASC LIMIT 5`;
    return {
      selected: rows[0] ?? null,
      alternatives: rows.slice(1),
      generatedAt: new Date().toISOString(),
    };
  }

  private async getTask(userId: string, id: string): Promise<LifeTaskRow | undefined> {
    const rows = await this.prisma.$queryRaw<LifeTaskRow[]>`
      SELECT * FROM "LifeTask"
      WHERE "id"=${id} AND "userId"=${userId} LIMIT 1`;
    return rows[0];
  }

  private async assertGoal(userId: string, id: string) {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Goal"
      WHERE "id"=${id} AND "userId"=${userId} LIMIT 1`;
    if (!rows[0]) throw new NotFoundException('Goal not found');
  }

  private async recordEvent(userId: string, id: string, dto: TaskEventDto) {
    const task = await this.getTask(userId, id);
    if (!task) throw new NotFoundException('Task not found');
    await this.prisma
      .$executeRaw`INSERT INTO "LifeTaskEvent" ("id","taskId","eventType","reason","metadata") VALUES (${randomUUID()},${id},${dto.eventType},${dto.reason?.trim() ?? null},${dto.metadata ? JSON.stringify(dto.metadata) : null}::jsonb)`;
  }

  private validateTitle(v?: string) {
    if (!v?.trim()) throw new BadRequestException('Task title is required');
  }

  private validatePriority(v: number) {
    if (!Number.isInteger(v) || v < 1 || v > 3)
      throw new BadRequestException('priority must be between 1 and 3');
  }

  private validateMinutes(v: number) {
    if (!Number.isInteger(v) || v < 1 || v > 1440)
      throw new BadRequestException(
        'estimatedMinutes must be between 1 and 1440',
      );
  }

  private date(v?: string | null) {
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime()))
      throw new BadRequestException('Invalid date');
    return d;
  }
}
