import { Injectable } from '@nestjs/common';
import {
  DecisionActionAdapter,
  DecisionActionAdapterService,
} from './decision-action-adapter.service';
import { DecisionCandidate } from './unified-decision-engine.service';
import { WorkoutService } from '../../workout/services/workout.service';
import { FitnessCatalogService, FitnessDiscipline } from '../../fitness/services/fitness-catalog.service';
import { FitnessProfileService } from '../../fitness/services/fitness-profile.service';

const DISCIPLINES: FitnessDiscipline[] = ['gym', 'calisthenics', 'yoga'];

@Injectable()
export class WorkoutActionAdapter implements DecisionActionAdapter {
  readonly actions = ['delete_workout', 'recommend_workout', 'update_workout'];

  constructor(
    private readonly registry: DecisionActionAdapterService,
    private readonly workouts: WorkoutService,
    private readonly fitnessCatalog: FitnessCatalogService,
    private readonly fitnessProfile: FitnessProfileService,
  ) {
    registry.register(this);
  }

  supports(candidate: DecisionCandidate): boolean {
    return this.actions.includes(candidate.action);
  }

  async execute(candidate: DecisionCandidate, context: Record<string, unknown>) {
    const userId = String(context.userId ?? '');
    if (!userId) throw new Error('Missing userId');
    const state = (context.contextualState as Record<string, unknown> | undefined) ?? {};

    if (candidate.action === 'recommend_workout') {
      const understanding = (state.localUnderstanding as Record<string, unknown> | undefined) ?? {};
      const entities = (understanding.entities as Record<string, unknown> | undefined) ?? {};
      const targetArea = typeof entities.targetArea === 'string' ? entities.targetArea : 'full_body';
      const requestedDiscipline = typeof entities.discipline === 'string' ? entities.discipline : undefined;
      const durationMinutes = typeof entities.durationMinutes === 'number' ? Math.max(1, Math.min(180, Math.floor(entities.durationMinutes))) : undefined;
      const profile = await this.fitnessProfile.get(userId);
      const profileDisciplines = profile.disciplines.filter((x): x is FitnessDiscipline => DISCIPLINES.includes(x as FitnessDiscipline));
      const selected = requestedDiscipline && DISCIPLINES.includes(requestedDiscipline as FitnessDiscipline)
        ? [requestedDiscipline as FitnessDiscipline]
        : profileDisciplines;
      const disciplines = selected.length ? selected : DISCIPLINES;
      const equipment = profile.equipment.filter((item) => item.active).map((item) => item.type);
      const results = await Promise.all(
        disciplines.map((discipline) =>
          this.fitnessCatalog.list({
            discipline,
            level: 10,
            query: targetArea === 'full_body' ? undefined : targetArea,
            page: 1,
            pageSize: 20,
            equipment,
          }),
        ),
      );
      const items = results
        .flatMap((result) => result.items)
        .filter((item) => targetArea === 'full_body' || item.focus.some((focus) => this.normalize(focus).includes(this.normalize(targetArea))))
        .sort((a, b) => a.difficultyLevel - b.difficultyLevel || a.name.localeCompare(b.name))
        .slice(0, 10);
      return {
        targetArea,
        disciplines,
        requestedDurationMinutes: durationMinutes ?? null,
        count: items.length,
        items,
        sourceOfTruth: 'FitnessCatalogService',
        mediaRequirement: '4 approved WebP assets per movement',
      };
    }

    const workoutId = String(state.targetResourceId ?? state.targetExecutionId ?? '');
    if (!workoutId) throw new Error('Missing workout target');
    if (candidate.action === 'delete_workout') return this.workouts.deleteWorkout(userId, workoutId);

    const input = this.normalizeDigits(String(context.input ?? '').trim());
    const durationMinutes = this.extractNumber(input, /(\d{1,3})\s*(?:min|mins|minute|minutes|دقیقه)/i);
    const caloriesBurned = this.extractNumber(input, /(\d{2,5})\s*(?:cal|calories|کالری)/i);
    const performedAt = this.extractDateTime(input);
    if (durationMinutes === null && caloriesBurned === null && !performedAt) throw new Error('Please provide a workout change such as duration, calories, or date/time');
    return this.workouts.updateWorkout(userId, workoutId, {
      ...(durationMinutes !== null ? { durationMinutes } : {}),
      ...(caloriesBurned !== null ? { caloriesBurned } : {}),
      ...(performedAt ? { performedAt } : {}),
    });
  }

  private normalize(value: string) {
    return value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  private normalizeDigits(input: string) { return input.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))); }
  private extractNumber(input: string, pattern: RegExp): number | null { const match = input.match(pattern); return match ? Number(match[1]) : null; }
  private extractDateTime(input: string): string | null {
    const date = input.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
    const time = input.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (!date && !time) return null;
    const base = date?.[1] ?? new Date().toISOString().slice(0, 10);
    const clock = time ? `${time[1].padStart(2, '0')}:${time[2]}` : '12:00';
    return `${base}T${clock}:00.000Z`;
  }
}
