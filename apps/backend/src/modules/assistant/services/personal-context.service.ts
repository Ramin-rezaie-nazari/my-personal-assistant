import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service';
import { BrainLifeContextService } from '../../personal-brain/services/brain-life-context.service';
import { NutritionService } from '../../nutrition/services/nutrition.service';
import { ConversationContextService } from './conversation-context.service';
import { GlobalUserSettingsService } from './global-user-settings.service';
import { GlobalizationContextService } from './globalization-context.service';
import { VoiceContextService } from './voice-context.service';

export type PersonalContextRequest = {
  userId: string;
  input?: string;
  dateKey?: string;
  countryCode?: string;
  voiceId?: string;
};

export type PersonalContext = {
  user: {
    id: string;
    name: string | null;
    timezone: string | null;
    language: string | null;
  } | null;
  globalization: ReturnType<GlobalizationContextService['resolve']>;
  voice: ReturnType<VoiceContextService['resolve']>;
  globalSettings: Awaited<ReturnType<GlobalUserSettingsService['get']>>;
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
    private readonly globalization: GlobalizationContextService,
    private readonly voice: VoiceContextService,
    private readonly globalSettings: GlobalUserSettingsService,
  ) {}

  async build(request: PersonalContextRequest): Promise<PersonalContext> {
    const dateKey = request.dateKey ?? new Date().toISOString().slice(0, 10);
    const [userRow, conversation, nutrition, life, storedSettings] = await Promise.all([
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
      this.globalSettings.get(request.userId),
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

    const globalization = request.countryCode || request.voiceId
      ? this.globalization.resolve({
          languageTag: storedSettings.languageTag,
          countryCode: request.countryCode ?? storedSettings.countryCode ?? undefined,
          currencyCode: storedSettings.currencyCode ?? undefined,
          measurementSystem: storedSettings.measurementSystem,
          timezone: storedSettings.timezone,
        })
      : storedSettings.globalization;

    const voice = request.voiceId || request.countryCode
      ? this.voice.resolve({
          languageTag: globalization.languageTag,
          countryCode: globalization.countryCode ?? undefined,
          voiceId: request.voiceId ?? storedSettings.voiceProfile.id,
        })
      : {
          profile: storedSettings.voiceProfile,
          locale: storedSettings.globalization,
          inputLanguage: storedSettings.voiceProfile.languageCode,
          synthesisLanguage: storedSettings.voiceProfile.languageCode,
          accent: storedSettings.voiceProfile.accent,
          direction: storedSettings.voiceProfile.direction,
        };

    return {
      user,
      globalization,
      voice,
      globalSettings: storedSettings,
      dateKey,
      request: { input: request.input },
      conversation,
      nutrition,
      life,
    };
  }
}
