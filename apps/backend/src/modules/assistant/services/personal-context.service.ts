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
    const [user, conversation, nutrition, life] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: request.userId },
        select: {
          id: true,
          name: true,
          timezone: true,
          language: true,
        },
      }),
      this.conversation.get(request.userId),
      this.nutrition.getDailySummary(request.userId, dateKey),
      this.life.getToday(request.userId, dateKey),
    ]);

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
