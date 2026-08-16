import { Injectable } from '@nestjs/common';

export type PersonalizationDomain = 'notification' | 'workout' | 'nutrition' | 'reminder' | 'habit' | 'schedule' | 'conversation' | 'shopping';
export type PreferenceSignal = { key: string; value: string; score: number; confidence?: number; source?: string };
export type PersonalizationProfile = { userId: string; updatedAt: Date; signals: Record<string, PreferenceSignal>; };

@Injectable()
export class PersonalizationEngineService {
  private readonly profiles = new Map<string, PersonalizationProfile>();

  upsertSignal(userId: string, domain: PersonalizationDomain, signal: Omit<PreferenceSignal, 'key'> & { key: string }) {
    const profile = this.profiles.get(userId) ?? { userId, updatedAt: new Date(0), signals: {} };
    const key = `${domain}.${signal.key}`;
    const previous = profile.signals[key];
    const previousConfidence = previous?.confidence ?? 0;
    const incomingConfidence = Math.max(0, Math.min(1, signal.confidence ?? 0.5));
    const incomingScore = Math.max(-1, Math.min(1, signal.score));
    const weight = incomingConfidence / Math.max(0.001, previousConfidence + incomingConfidence);
    const blendedScore = previous ? previous.score * (1 - weight) + incomingScore * weight : incomingScore;
    profile.signals[key] = { ...signal, key, score: Math.max(-1, Math.min(1, blendedScore)), confidence: Math.max(previousConfidence, incomingConfidence), source: signal.source ?? 'behavior' };
    profile.updatedAt = new Date();
    this.profiles.set(userId, profile);
    return profile.signals[key];
  }

  getProfile(userId: string): PersonalizationProfile {
    return this.profiles.get(userId) ?? { userId, updatedAt: new Date(0), signals: {} };
  }

  getSignal(userId: string, domain: PersonalizationDomain, key: string) {
    return this.getProfile(userId).signals[`${domain}.${key}`] ?? null;
  }
}
