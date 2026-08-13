import { Injectable } from '@nestjs/common';

export type FitnessPerformanceSnapshot = {
  formScoreAvg?: number;
  completionRate?: number;
  recentDifficulty?: number;
  recoveryScore?: number;
};

export type FitnessProgressionDecision = {
  action: 'progress' | 'stay' | 'regress' | 'deload';
  confidence: number;
  reason: string;
  levelDelta: -1 | 0 | 1;
  volumeMultiplier: number;
  intensityMultiplier: number;
};

@Injectable()
export class FitnessProgressionService {
  evaluate(performance?: FitnessPerformanceSnapshot): FitnessProgressionDecision {
    if (!performance) {
      return { action: 'stay', confidence: 0.45, reason: 'insufficient-performance-data', levelDelta: 0, volumeMultiplier: 1, intensityMultiplier: 1 };
    }

    const form = performance.formScoreAvg ?? 0.75;
    const completion = performance.completionRate ?? 0.75;
    const difficulty = performance.recentDifficulty ?? 0.5;
    const recovery = performance.recoveryScore ?? 0.75;

    if (recovery < 0.45) {
      return { action: 'deload', confidence: 0.92, reason: 'recovery-low', levelDelta: 0, volumeMultiplier: 0.65, intensityMultiplier: 0.8 };
    }
    if (form < 0.65 || completion < 0.65) {
      return { action: 'regress', confidence: 0.91, reason: form < 0.65 ? 'form-below-safe-progress-threshold' : 'completion-below-threshold', levelDelta: -1, volumeMultiplier: 0.85, intensityMultiplier: 0.85 };
    }
    if (form >= 0.9 && completion >= 0.9 && difficulty < 0.7 && recovery >= 0.7) {
      return { action: 'progress', confidence: 0.94, reason: 'strong-form-high-completion-low-perceived-difficulty', levelDelta: 1, volumeMultiplier: 1.08, intensityMultiplier: 1.08 };
    }
    return { action: 'stay', confidence: 0.82, reason: 'performance-within-adaptive-band', levelDelta: 0, volumeMultiplier: 1, intensityMultiplier: 1 };
  }
}
