import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service';
import {
  GlobalizationContext,
  GlobalizationContextService,
  MeasurementSystem,
} from './globalization-context.service';
import { VoiceContext, VoiceContextService } from './voice-context.service';

const FACT_CATEGORY = 'globalization';
const FACT_KEYS = {
  countryCode: 'countryCode',
  currencyCode: 'currencyCode',
  measurementSystem: 'measurementSystem',
  voiceProfile: 'voiceProfile',
} as const;

type StoredSettings = {
  countryCode?: string;
  currencyCode?: string;
  measurementSystem?: MeasurementSystem;
  voiceProfile?: string;
};

export type GlobalUserSettings = Readonly<{
  languageTag: string;
  countryCode: string | null;
  currencyCode: string | null;
  measurementSystem: MeasurementSystem;
  timezone: string;
  voiceProfile: VoiceContext['profile'];
  globalization: GlobalizationContext;
}>;

export type UpdateGlobalUserSettings = Partial<{
  languageTag: string;
  countryCode: string | null;
  currencyCode: string | null;
  measurementSystem: MeasurementSystem;
  timezone: string;
  voiceProfile: string | null;
}>;

@Injectable()
export class GlobalUserSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly globalization: GlobalizationContextService,
    private readonly voice: VoiceContextService,
  ) {}

  async get(userId: string): Promise<GlobalUserSettings> {
    const [user, facts] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          settings: {
            select: {
              language: true,
              timezone: true,
            },
          },
        },
      }),
      this.prisma.userFact.findMany({
        where: { userId, category: FACT_CATEGORY },
        select: { key: true, value: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    if (!user) throw new BadRequestException('user_not_found');

    const stored = this.readFacts(facts);
    return this.resolve(user.settings?.language ?? 'en-US', user.settings?.timezone ?? 'UTC', stored);
  }

  async update(userId: string, patch: UpdateGlobalUserSettings): Promise<GlobalUserSettings> {
    const current = await this.get(userId);
    const languageTag = patch.languageTag ?? current.languageTag;
    const timezone = patch.timezone ?? current.timezone;
    const globalization = this.globalization.resolve({
      languageTag,
      countryCode: patch.countryCode ?? current.countryCode ?? undefined,
      currencyCode: patch.currencyCode ?? current.currencyCode ?? undefined,
      measurementSystem: patch.measurementSystem ?? current.measurementSystem,
      timezone,
    });

    const voiceProfileId = patch.voiceProfile ?? current.voiceProfile.id;
    const voice = this.voice.resolve({
      languageTag: globalization.languageTag,
      countryCode: globalization.countryCode ?? undefined,
      voiceId: voiceProfileId,
    });

    if (patch.voiceProfile && voice.profile.id !== patch.voiceProfile) {
      throw new BadRequestException('unsupported_voice_profile');
    }

    const operations = [
      this.prisma.userSettings.upsert({
        where: { userId },
        create: { userId, language: globalization.languageTag, timezone },
        update: { language: globalization.languageTag, timezone },
      }),
      ...this.factOperations(userId, FACT_KEYS.countryCode, globalization.countryCode),
      ...this.factOperations(userId, FACT_KEYS.currencyCode, globalization.currencyCode),
      ...this.factOperations(userId, FACT_KEYS.measurementSystem, globalization.measurementSystem),
      ...this.factOperations(userId, FACT_KEYS.voiceProfile, voice.profile.id),
    ];

    await this.prisma.$transaction(operations);

    return {
      languageTag: globalization.languageTag,
      countryCode: globalization.countryCode,
      currencyCode: globalization.currencyCode,
      measurementSystem: globalization.measurementSystem,
      timezone,
      voiceProfile: voice.profile,
      globalization,
    };
  }

  private resolve(languageTag: string, timezone: string, stored: StoredSettings): GlobalUserSettings {
    const globalization = this.globalization.resolve({
      languageTag,
      countryCode: stored.countryCode,
      currencyCode: stored.currencyCode,
      measurementSystem: stored.measurementSystem,
      timezone,
    });
    const voice = this.voice.resolve({
      languageTag: globalization.languageTag,
      countryCode: globalization.countryCode ?? undefined,
      voiceId: stored.voiceProfile,
    });

    return {
      languageTag: globalization.languageTag,
      countryCode: globalization.countryCode,
      currencyCode: globalization.currencyCode,
      measurementSystem: globalization.measurementSystem,
      timezone: globalization.timezone,
      voiceProfile: voice.profile,
      globalization,
    };
  }

  private readFacts(facts: Array<{ key: string; value: string }>): StoredSettings {
    const result: StoredSettings = {};
    for (const fact of facts) {
      if (fact.key === FACT_KEYS.countryCode && !result.countryCode) result.countryCode = fact.value;
      if (fact.key === FACT_KEYS.currencyCode && !result.currencyCode) result.currencyCode = fact.value;
      if (fact.key === FACT_KEYS.measurementSystem && !result.measurementSystem) {
        if (fact.value === 'metric' || fact.value === 'us-customary' || fact.value === 'uk-imperial') {
          result.measurementSystem = fact.value;
        }
      }
      if (fact.key === FACT_KEYS.voiceProfile && !result.voiceProfile) result.voiceProfile = fact.value;
    }
    return result;
  }

  private factOperations(userId: string, key: string, value: string | null) {
    if (value === null) {
      return [
        this.prisma.userFact.deleteMany({ where: { userId, category: FACT_CATEGORY, key } }),
      ];
    }

    return [
      this.prisma.userFact.deleteMany({ where: { userId, category: FACT_CATEGORY, key } }),
      this.prisma.userFact.create({
        data: {
          userId,
          category: FACT_CATEGORY,
          key,
          value,
          source: 'settings',
          confidence: 1,
          importance: 2,
        },
      }),
    ];
  }
}
