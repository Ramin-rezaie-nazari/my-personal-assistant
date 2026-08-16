import { Injectable } from '@nestjs/common';

export type ScenarioIntent = {
  enabled: boolean;
  reason: string;
  mode: 'compare' | 'none';
};

@Injectable()
export class ScenarioIntentService {
  detect(input: string): ScenarioIntent {
    const normalized = input.trim().toLowerCase();
    const markers = [
      'what if',
      'which is better',
      'should i',
      'compare',
      'versus',
      'vs',
      'چی بهتره',
      'کدوم بهتره',
      'اگه',
      'اگر',
      'مقایسه',
      'یا این',
      'یا اون',
      'بهتره یا',
      'چه میشه',
      'چی میشه',
      'چه اتفاقی',
    ];
    const enabled = markers.some((marker) => normalized.includes(marker));
    return {
      enabled,
      reason: enabled ? 'scenario_language_detected' : 'standard_request',
      mode: enabled ? 'compare' : 'none',
    };
  }
}
