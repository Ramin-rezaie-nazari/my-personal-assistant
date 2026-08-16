import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { DecisionActionAdapter, DecisionActionAdapterService } from './decision-action-adapter.service';
import { DecisionCandidate } from './unified-decision-engine.service';

@Injectable()
export class LifeTaskActionAdapter implements DecisionActionAdapter {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: DecisionActionAdapterService,
  ) {
    registry.register(this);
  }

  supports(candidate: DecisionCandidate) {
    return candidate.domain === 'schedule' && candidate.action === 'complete_life_task';
  }

  async execute(candidate: DecisionCandidate, context: Record<string, unknown>) {
    const userId = String(context.userId ?? '');
    if (!userId) throw new Error('Missing userId');

    const rows = await this.prisma.$queryRaw<Array<{ id: string; status: string; title: string }>>`
      SELECT "id","status","title" FROM "LifeTask" WHERE "id"=${candidate.id} AND "userId"=${userId} LIMIT 1`;
    const task = rows[0];
    if (!task) throw new Error('life_task_not_found');
    if (task.status === 'completed') return { taskId: task.id, status: 'completed', alreadyCompleted: true };

    await this.prisma.$executeRaw`UPDATE "LifeTask" SET "status"='completed', "completedAt"=CURRENT_TIMESTAMP, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${task.id} AND "userId"=${userId}`;
    return { taskId: task.id, status: 'completed', title: task.title };
  }
}
