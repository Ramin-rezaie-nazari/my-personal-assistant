import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../common/database/prisma.service';
import {
  CreateTaskDto,
  TaskDependencyDto,
  TaskEventDto,
  UpdateTaskDto,
} from '../dto/task.dto';

type TaskRow = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  source: string;
  goalId: string | null;
  status: string;
  priority: number;
  energy: string;
  scheduledAt: Date | null;
  dueAt: Date | null;
  estimatedMinutes: number | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class LifeExecutionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTaskDto) {
    if (!dto.title?.trim())
      throw new BadRequestException('Task title is required');
    this.validatePriority(dto.priority ?? 2);
    const id = randomUUID();
    const scheduledAt = this.date(dto.scheduledAt);
    const dueAt = this.date(dto.dueAt);
    await this.prisma
      .$executeRaw`INSERT INTO "LifeTask" ("id","userId","title","description","source","goalId","priority","energy","scheduledAt","dueAt","estimatedMinutes") VALUES (${id},${userId},${dto.title.trim()},${dto.description?.trim() ?? null},${dto.source ?? 'manual'},${dto.goalId ?? null},${dto.priority ?? 2},${dto.energy ?? 'medium'},${scheduledAt},${dueAt},${dto.estimatedMinutes ?? null})`;
    await this.event(userId, id, 'created', 'task_created');
    return this.one(userId, id);
  }

  async list(userId: string, status?: string) {
    if (status)
      return this.prisma.$queryRaw<
        TaskRow[]
      >`SELECT * FROM "LifeTask" WHERE "userId"=${userId} AND "status"=${status} ORDER BY "priority" ASC, "dueAt" ASC NULLS LAST, "scheduledAt" ASC NULLS LAST, "createdAt" DESC`;
    return this.prisma.$queryRaw<
      TaskRow[]
    >`SELECT * FROM "LifeTask" WHERE "userId"=${userId} AND "status" NOT IN ('completed','cancelled') ORDER BY CASE WHEN "dueAt" < CURRENT_TIMESTAMP THEN 0 ELSE 1 END, "priority" ASC, "dueAt" ASC NULLS LAST, "scheduledAt" ASC NULLS LAST`;
  }

  async nextBest(userId: string) {
    const tasks = await this.prisma.$queryRaw<
      TaskRow[]
    >`SELECT t.* FROM "LifeTask" t WHERE t."userId"=${userId} AND t."status" IN ('pending','in_progress') AND NOT EXISTS (SELECT 1 FROM "TaskDependency" d JOIN "LifeTask" dep ON dep."id"=d."dependsOnTaskId" WHERE d."taskId"=t."id" AND dep."status" <> 'completed') ORDER BY t."priority" ASC, CASE WHEN t."dueAt" IS NULL THEN 1 ELSE 0 END, t."dueAt" ASC NULLS LAST, CASE t."energy" WHEN 'low' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, t."createdAt" ASC LIMIT 20`;
    const now = Date.now();
    const ranked = tasks
      .map((task) => {
        let score = (4 - task.priority) * 30;
        if (task.dueAt) {
          const hours = (task.dueAt.getTime() - now) / 3600000;
          score += hours < 0 ? 45 : hours < 24 ? 35 : hours < 72 ? 20 : 5;
        }
        if (task.status === 'in_progress') score += 25;
        if (task.energy === 'low') score += 3;
        return { task, score };
      })
      .sort((a, b) => b.score - a.score);
    return {
      task: ranked[0]?.task ?? null,
      alternatives: ranked.slice(1, 4).map((item) => item.task),
      reason: ranked[0]
        ? this.reason(ranked[0].task)
        : 'Nothing actionable right now',
    };
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const existing = await this.raw(userId, id);
    if (!existing) throw new NotFoundException('Task not found');
    if (dto.priority !== undefined) this.validatePriority(dto.priority);
    const status = dto.status ?? existing.status;
    const completedAt =
      status === 'completed'
        ? new Date()
        : status === 'in_progress' || status === 'pending'
          ? null
          : existing.completedAt;
    await this.prisma
      .$executeRaw`UPDATE "LifeTask" SET "title"=${dto.title?.trim() ?? existing.title},"description"=${dto.description === undefined ? existing.description : dto.description?.trim() || null},"status"=${status},"priority"=${dto.priority ?? existing.priority},"energy"=${dto.energy ?? existing.energy},"scheduledAt"=${dto.scheduledAt === undefined ? existing.scheduledAt : this.date(dto.scheduledAt)},"dueAt"=${dto.dueAt === undefined ? existing.dueAt : this.date(dto.dueAt)},"estimatedMinutes"=${dto.estimatedMinutes === undefined ? existing.estimatedMinutes : dto.estimatedMinutes},"completedAt"=${completedAt},"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${id} AND "userId"=${userId}`;
    if (dto.status) await this.event(userId, id, dto.status, 'status_changed');
    return this.one(userId, id);
  }

  async addDependency(userId: string, taskId: string, dto: TaskDependencyDto) {
    const task = await this.raw(userId, taskId);
    if (!task) throw new NotFoundException('Task not found');
    const dependency = await this.raw(userId, dto.dependsOnTaskId);
    if (!dependency) throw new NotFoundException('Dependency task not found');
    if (taskId === dto.dependsOnTaskId)
      throw new BadRequestException('A task cannot depend on itself');
    await this.prisma
      .$executeRaw`INSERT INTO "TaskDependency" ("id","taskId","dependsOnTaskId") VALUES (${randomUUID()},${taskId},${dto.dependsOnTaskId}) ON CONFLICT ("taskId","dependsOnTaskId") DO NOTHING`;
    return { taskId, dependsOnTaskId: dto.dependsOnTaskId };
  }

  async recordEvent(userId: string, id: string, dto: TaskEventDto) {
    const task = await this.raw(userId, id);
    if (!task) throw new NotFoundException('Task not found');
    await this.event(userId, id, dto.event, dto.reason, dto.metadata);
    const status =
      dto.event === 'completed'
        ? 'completed'
        : dto.event === 'started'
          ? 'in_progress'
          : dto.event === 'cancelled'
            ? 'cancelled'
            : dto.event === 'snoozed'
              ? 'snoozed'
              : task.status;
    if (status !== task.status)
      await this.prisma
        .$executeRaw`UPDATE "LifeTask" SET "status"=${status},"completedAt"=${status === 'completed' ? new Date() : null},"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${id} AND "userId"=${userId}`;
    return this.one(userId, id);
  }

  async one(userId: string, id: string) {
    const row = await this.raw(userId, id);
    if (!row) throw new NotFoundException('Task not found');
    return row;
  }

  private async raw(userId: string, id: string) {
    const rows = await this.prisma.$queryRaw<
      TaskRow[]
    >`SELECT * FROM "LifeTask" WHERE "id"=${id} AND "userId"=${userId} LIMIT 1`;
    return rows[0];
  }
  private async event(
    userId: string,
    taskId: string,
    event: string,
    reason?: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.prisma
      .$executeRaw`INSERT INTO "TaskEvent" ("id","taskId","userId","event","reason","metadata") VALUES (${randomUUID()},${taskId},${userId},${event},${reason ?? null},${metadata ? JSON.stringify(metadata) : null}::jsonb)`;
  }
  private date(value?: string | null) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
      throw new BadRequestException('Invalid date');
    return date;
  }
  private validatePriority(value: number) {
    if (!Number.isInteger(value) || value < 1 || value > 3)
      throw new BadRequestException('priority must be between 1 and 3');
  }
  private reason(task: TaskRow) {
    if (task.status === 'in_progress')
      return 'Continue the task you already started';
    if (task.dueAt && task.dueAt.getTime() < Date.now())
      return 'This task is overdue';
    if (task.dueAt && task.dueAt.getTime() - Date.now() < 86400000)
      return 'This task is due within 24 hours';
    if (task.priority === 1) return 'Highest priority actionable task';
    return 'Best available next action based on priority, timing and momentum';
  }
}
