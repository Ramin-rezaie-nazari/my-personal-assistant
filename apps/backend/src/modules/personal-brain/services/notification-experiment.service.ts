import { Injectable } from '@nestjs/common';

export type ExperimentArm = { id: string; label: string; enabled?: boolean };
export type ExperimentObservation = { armId: string; success: boolean };
export type ExperimentDecision = { armId: string; reason: string; exploration: boolean };

@Injectable()
export class NotificationExperimentService {
  private readonly observations = new Map<string, Map<string, { success: number; total: number }>>();

  choose(experimentId: string, arms: ExperimentArm[], explorationRate = 0.1): ExperimentDecision {
    const active = arms.filter((a) => a.enabled !== false);
    if (!active.length) throw new Error('No active experiment arms');
    const stats = this.observations.get(experimentId) ?? new Map();
    this.observations.set(experimentId, stats);
    const unknown = active.find((arm) => !stats.has(arm.id));
    if (unknown) return { armId: unknown.id, reason: 'cold_start_exploration', exploration: true };
    if (Math.random() < explorationRate) {
      const random = active[Math.floor(Math.random() * active.length)];
      return { armId: random.id, reason: 'controlled_exploration', exploration: true };
    }
    const ranked = active.map((arm) => {
      const s = stats.get(arm.id)!;
      return { arm, rate: s.success / Math.max(1, s.total) };
    }).sort((a, b) => b.rate - a.rate);
    return { armId: ranked[0].arm.id, reason: 'best_observed_success_rate', exploration: false };
  }

  observe(experimentId: string, observation: ExperimentObservation) {
    const stats = this.observations.get(experimentId) ?? new Map();
    const current = stats.get(observation.armId) ?? { success: 0, total: 0 };
    stats.set(observation.armId, { success: current.success + (observation.success ? 1 : 0), total: current.total + 1 });
    this.observations.set(experimentId, stats);
  }
}
