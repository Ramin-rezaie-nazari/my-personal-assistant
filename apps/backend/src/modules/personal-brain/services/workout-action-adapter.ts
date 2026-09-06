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
const TARGET_FOCUS_ALIASES: Record<string, string[]> = {
  shoulders: ['shoulder', 'deltoid'],
  chest: ['chest', 'pector', 'pec'],
  back: ['back', 'lat', 'lats', 'trapezius', 'trap'],
  arms: ['arm', 'biceps', 'triceps', 'forearm'],
  core: ['core', 'ab', 'abdominal', 'oblique'],
  waist: ['waist', 'oblique', 'core'],
  glutes: ['glute', 'glutes'],
  thighs: ['thigh', 'quadriceps', 'quad', 'hamstring'],
  legs: ['leg', 'quadriceps', 'quad', 'hamstring'],
  calves: ['calf', 'calves'],
};

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
      const targetAreas = this.readTargetAreas(entities);
      const requestedDiscipline = typeof entities.discipline === 'string' ? entities.discipline : undefined;
      const durationMinutes = typeof entities.durationMinutes === 'number' ? Math.max(1, Math.min(180, Math.floor(entities.durationMinutes))) : undefined;
      const requestedLevel = typeof entities.difficultyLevel === 'number' ? Math.max(1, Math.min(10, Math.floor(entities.difficultyLevel))) : 10;
      const requestedEquipment = Array.isArray(entities.equipment)
        ? entities.equipment.filter((x): x is string => typeof x === 'string')
        : [];
      const profile = await this.fitnessProfile.get(userId);
      const profileDisciplines = profile.disciplines.filter((x): x is FitnessDiscipline => DISCIPLINES.includes(x as FitnessDiscipline));
      const selected = requestedDiscipline && DISCIPLINES.includes(requestedDiscipline as FitnessDiscipline)
        ? [requestedDiscipline as FitnessDiscipline]
        : profileDisciplines;
      const disciplines = selected.length ? selected : DISCIPLINES;
      const equipment = requestedEquipment.length ? requestedEquipment : profile.equipment.filter((item) => item.active).map((item) => item.type);

      const perDiscipline = await Promise.all(disciplines.map(async (discipline) => {
        const collected = [] as Awaited<ReturnType<FitnessCatalogService['list']>>['items'];
        const queries = targetAreas.length && !targetAreas.includes('full_body')
          ? targetAreas.flatMap((target) => TARGET_FOCUS_ALIASES[target] ?? [target])
          : [undefined];
        for (const query of [...new Set(queries)]) {
          for (let page = 1; page <= 4 && collected.length < 40; page += 1) {
            const result = await this.fitnessCatalog.list({
              discipline,
              level: requestedLevel,
              query,
              page,
              pageSize: 50,
              equipment: [],
            });
            collected.push(...result.items.filter((item) => equipment.length === 0 || item.equipment.some((value) => equipment.includes(value))));
            if (!result.hasNextPage) break;
          }
        }
        return collected;
      }));

      const unique = new Map(perDiscipline.flat().map((item) => [item.id, item]));
      const items = [...unique.values()]
        .filter((item) => this.matchesTargets(item.focus, targetAreas))
        .sort((a, b) => this.targetScore(b.focus, targetAreas) - this.targetScore(a.focus, targetAreas) || a.difficultyLevel - b.difficultyLevel || a.name.localeCompare(b.name))
        .slice(0, this.exerciseCountForDuration(durationMinutes));

      return {
        targetAreas,
        targetArea: targetAreas[0] ?? 'full_body',
        disciplines,
        requestedDurationMinutes: durationMinutes ?? null,
        requestedDifficultyLevel: requestedLevel,
        requestedEquipment: equipment,
        count: items.length,
        items,
        coachNotes: this.buildCoachNotes(targetAreas, durationMinutes, requestedLevel, equipment),
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

  private readTargetAreas(entities: Record<string, unknown>): string[] {
    const values = Array.isArray(entities.targetAreas)
      ? entities.targetAreas.filter((x): x is string => typeof x === 'string')
      : [];
    if (values.length) return [...new Set(values)];
    return typeof entities.targetArea === 'string' ? [entities.targetArea] : ['full_body'];
  }

  private matchesTargets(focus: string[], targets: string[]) {
    if (!targets.length || targets.includes('full_body')) return true;
    const normalizedFocus = focus.map((value) => this.normalize(value));
    return targets.some((target) => {
      const aliases = TARGET_FOCUS_ALIASES[target] ?? [target];
      return aliases.some((alias) => normalizedFocus.some((value) => value.includes(this.normalize(alias))));
    });
  }

  private targetScore(focus: string[], targets: string[]) {
    if (!targets.length || targets.includes('full_body')) return 0;
    return targets.reduce((score, target) => {
      const aliases = TARGET_FOCUS_ALIASES[target] ?? [target];
      const hits = aliases.filter((alias) => focus.some((value) => this.normalize(value).includes(this.normalize(alias))));
      return score + hits.length;
    }, 0);
  }

  private exerciseCountForDuration(durationMinutes?: number) {
    if (durationMinutes === undefined) return 8;
    if (durationMinutes <= 15) return 4;
    if (durationMinutes <= 30) return 6;
    return 8;
  }

  private buildCoachNotes(targets: string[], duration?: number, level?: number, equipment: string[] = []) {
    const targetText = targets.length && !targets.includes('full_body') ? targets.join(' + ') : 'full body';
    const notes = [`Focus: ${targetText}.`];
    if (duration) notes.push(`Session target: about ${duration} minutes.`);
    if (level) notes.push(`Difficulty ceiling: level ${level}.`);
    if (equipment.length) notes.push(`Equipment respected: ${equipment.join(', ')}.`);
    notes.push('Start with a controlled warm-up and stop any movement that causes sharp or unusual pain.');
    return notes;
  }

  private normalize(value: string) { return value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim(); }
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
