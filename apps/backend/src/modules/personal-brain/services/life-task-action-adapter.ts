import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { DecisionActionAdapter } from './decision-action-adapter.service';
import { DecisionCandidate } from './unified-decision-engine.service';

@Injectable()
export class LifeTaskActionAdapter implements DecisionActionAdapter {
  constructor(private readonly prisma: PrismaService) {}

  supports(candidate: DecisionCandidate) {
    return candidate.domain === 'schedule' && candidate.action === 'complete_life_task';
  }

  async execute(candidate: DecisionCandidate, context: Record<string, unknown>) {
    const task = await this.prisma.lifeTask.findFirst({
      where: { id: candidate.id, userId: String(context.userId ?? '') },
      select: { id: true, status: true, title: true },
    });
    if (!task) throw new Error('life_task_not_found');
    if (task.status === 'completed') return { taskId: task.id, status: 'completed', alreadyCompleted: true };

    const updated = await this.prisma.lifeTask.update({
      where: { id: task.id },
      data: { status: 'completed' },
      select: { id: true, status: true, title: true },
    });
    return { taskId: updated.id, status: updated.status, title: updated.title };
  }
}
