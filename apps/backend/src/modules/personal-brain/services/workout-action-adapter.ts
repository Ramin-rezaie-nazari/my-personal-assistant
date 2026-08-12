import { Injectable } from '@nestjs/common';
import { DecisionActionAdapter, DecisionActionAdapterService } from './decision-action-adapter.service';
import { DecisionCandidate } from './unified-decision-engine.service';
import { WorkoutService } from '../../workout/services/workout.service';

@Injectable()
export class WorkoutActionAdapter implements DecisionActionAdapter {
  constructor(
    private readonly registry: DecisionActionAdapterService,
    private readonly workouts: WorkoutService,
  ) {
    registry.register(this);
  }

  supports(candidate: DecisionCandidate): boolean {
    return ['update_workout', 'delete_workout'].includes(candidate.action);
  }

  async execute(candidate: DecisionCandidate, context: Record<string, unknown>) {
    const userId = String(context.userId ?? '');
    if (!userId) throw new Error('Missing userId');
    const state = (context.contextualState as Record<string, unknown> | undefined) ?? {};
    const workoutId = String(state.targetResourceId ?? state.targetExecutionId ?? '');
    if (!workoutId) throw new Error('Missing workout target');

    if (candidate.action === 'delete_workout') {
      return this.workouts.deleteWorkout(userId, workoutId);
    }

    const input = String(context.input ?? '').trim();
    const durationMinutes = this.extractNumber(input, /\b(\d{1,3})\s*(?:min|mins|minute|minutes|دقیقه)\b/i);
    const caloriesBurned = this.extractNumber(input, /\b(\d{2,5})\s*(?:cal|calories|کالری)\b/i);
    const performedAt = this.extractDateTime(input);

    if (durationMinutes === null && caloriesBurned === null && !performedAt) {
      throw new Error('Please provide a workout change such as duration, calories, or date/time');
    }

    return this.workouts.updateWorkout(userId, workoutId, {
      ...(durationMinutes !== null ? { durationMinutes } : {}),
      ...(caloriesBurned !== null ? { caloriesBurned } : {}),
      ...(performedAt ? { performedAt } : {}),
    });
  }

  private extractNumber(input: string, pattern: RegExp): number | null {
    const match = input.match(pattern);
    return match ? Number(match[1]) : null;
  }

  private extractDateTime(input: string): string | null {
    const date = input.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
    const time = input.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (!date && !time) return null;
    const base = date?.[1] ?? new Date().toISOString().slice(0, 10);
    const clock = time ? `${time[1].padStart(2, '0')}:${time[2]}` : '12:00';
    return `${base}T${clock}:00.000Z`;
  }
}
