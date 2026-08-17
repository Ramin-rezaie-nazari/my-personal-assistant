import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service';
import { BrainLifeContextService } from '../../personal-brain/services/brain-life-context.service';
import { NutritionService } from '../../nutrition/services/nutrition.service';
import { ConversationContextService } from './conversation-context.service';

export type PersonalContextRequest = {
  userId: string;
  input?: string;
  dateKey?: string;
};

export type PersonalContext = {
  user: {
    id: string;
    name: string | null;
    timezone: string | null;
    language: string | null;
  } | null;
  dateKey: string;
  request: {
    input?: string;
  };
  conversation: Awaited<ReturnType<ConversationContextService['get']>>;
  nutrition: Awaited<ReturnType<NutritionService['getDailySummary']>>;
  life: Awaited<ReturnType<BrainLifeContextService['getToday']>>;
};

@Injectable()
export class PersonalContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversation: ConversationContextService,
    private readonly nutrition: NutritionService,
    private readonly life: BrainLifeContextService,
  ) {}

  async build(request: PersonalContextRequest): Promise<PersonalContext> {
    const dateKey = request.dateKey ?? new Date().toISOString().slice(0, 10);
    const [userRow, conversation, nutrition, life] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: request.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          settings: {
            select: {
              timezone: true,
              language: true,
            },
          },
        },
      }),
      this.conversation.get(request.userId),
      this.nutrition.getDailySummary(request.userId, dateKey),
      this.life.getToday(request.userId, dateKey),
    ]);

    const user = userRow
      ? {
          id: userRow.id,
          name: [userRow.firstName, userRow.lastName]
            .filter(Boolean)
            .join(' ') || null,
          timezone: userRow.settings?.timezone ?? null,
          language: userRow.settings?.language ?? null,
        }
      : null;

    return {
      user,
      dateKey,
      request: { input: request.input },
      conversation,
      nutrition,
      life,
    };
  }
}
