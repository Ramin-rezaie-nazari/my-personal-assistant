import { Injectable } from '@nestjs/common';

export type NotificationChannel = 'in_app' | 'push' | 'email' | 'web_push';
export type ChannelSignal = { channel: NotificationChannel; delivered: number; opened: number; completed: number; dismissed: number; snoozed: number };

export type ChannelRecommendation = { channel: NotificationChannel; score: number; reason: string };

@Injectable()
export class NotificationChannelIntelligenceService {
  rank(signals: ChannelSignal[], allowed: NotificationChannel[] = ['push', 'in_app', 'email', 'web_push']): ChannelRecommendation[] {
    return allowed.map((channel) => {
      const s = signals.find((x) => x.channel === channel) ?? { channel, delivered: 0, opened: 0, completed: 0, dismissed: 0, snoozed: 0 };
      if (s.delivered === 0) return { channel, score: 0.5, reason: 'insufficient_delivery_history' };
      const openRate = s.opened / s.delivered;
      const completionRate = s.completed / Math.max(1, s.opened);
      const negativeRate = (s.dismissed + s.snoozed) / s.delivered;
      const score = Math.max(0, Math.min(1, openRate * 0.45 + completionRate * 0.45 + (1 - negativeRate) * 0.10));
      return { channel, score, reason: 'ranked_from_delivery_and_engagement_history' };
    }).sort((a, b) => b.score - a.score);
  }

  choose(signals: ChannelSignal[], allowed?: NotificationChannel[]): NotificationRecommendation {
    const ranked = this.rank(signals, allowed);
    return { primary: ranked[0]?.channel ?? 'in_app', ranked };
  }
}

export type NotificationRecommendation = { primary: NotificationChannel; ranked: ChannelRecommendation[] };
