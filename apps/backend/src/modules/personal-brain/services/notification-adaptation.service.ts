import { Injectable } from '@nestjs/common';
import { NotificationSignal } from './notification-feedback.service';

export type NotificationAdaptation = {
  recommendedMinimumPriority: 'critical' | 'high' | 'normal';
  recommendedQuietHoursExtensionMinutes: number;
  recommendedAction:
    'keep' | 'reduce_frequency' | 'shift_timing' | 'raise_priority_only';
  confidence: number;
  reason: string;
};

@Injectable()
export class NotificationAdaptationService {
  recommend(signal: NotificationSignal): NotificationAdaptation {
    const resistance = signal.resistanceScore;
    const engagement = signal.engagementScore;
    if (resistance >= 0.7)
      return {
        recommendedMinimumPriority: 'high',
        recommendedQuietHoursExtensionMinutes: 30,
        recommendedAction: 'reduce_frequency',
        confidence: Math.min(0.95, resistance),
        reason:
          'Repeated snooze, dismiss, or ignore behavior indicates notification fatigue.',
      };
    if (engagement >= 0.7 && resistance < 0.3)
      return {
        recommendedMinimumPriority: 'normal',
        recommendedQuietHoursExtensionMinutes: 0,
        recommendedAction: 'keep',
        confidence: Math.min(0.95, engagement),
        reason: 'The user consistently engages with this notification pattern.',
      };
    if (resistance >= 0.45)
      return {
        recommendedMinimumPriority: 'high',
        recommendedQuietHoursExtensionMinutes: 15,
        recommendedAction: 'shift_timing',
        confidence: 0.7,
        reason:
          'Mixed engagement suggests timing or frequency should be softened.',
      };
    return {
      recommendedMinimumPriority: 'normal',
      recommendedQuietHoursExtensionMinutes: 0,
      recommendedAction: 'keep',
      confidence: 0.5,
      reason:
        'There is not enough negative signal to change the default policy.',
    };
  }
}
