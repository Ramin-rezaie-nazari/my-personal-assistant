import { Injectable } from '@nestjs/common';
import { FitnessCatalogService, FitnessDiscipline } from '../../fitness/services/fitness-catalog.service';
import { DecisionActionAdapter, DecisionActionAdapterService } from './decision-action-adapter.service';
import { DecisionCandidate } from './unified-decision-engine.service';

const DISCIPLINES: FitnessDiscipline[] = ['gym', 'calisthenics', 'yoga'];

@Injectable()
export class WorkoutRecommendationActionAdapter implements DecisionActionAdapter {
  readonly actions = ['recommend_workout'];

  constructor(
    registry: DecisionActionAdapterService,
    private readonly catalog: FitnessCatalogService,
  ) {
    registry.register(this);
  }

  supports(candidate: DecisionCandidate): boolean {
    return candidate.action === 'recommend_workout';
  }

  async execute(_candidate: DecisionCandidate, context: Record<string, unknown>) {
    const state = (context.contextualState as Record<string, unknown> | undefined) ?? {};
    const understanding = (state.localUnderstanding as Record<string, unknown> | undefined) ?? {};
    const entities = (understanding.entities as Record<string, unknown> | undefined) ?? {};
    const targetArea = typeof entities.targetArea === 'string' ? entities.targetArea : 'full_body';
    const requestedDiscipline = typeof entities.discipline === 'string' ? entities.discipline : undefined;
    const profile = (state.fitnessContext as Record<string, unknown> | undefined) ?? {};
    const profileDisciplines = Array.isArray(profile.disciplines) ? profile.disciplines.filter((x): x is string => typeof x === 'string') : [];
    const disciplines = requestedDiscipline && DISCIPLINES.includes(requestedDiscipline as FitnessDiscipline)
      ? [requestedDiscipline as FitnessDiscipline]
      : profileDisciplines.filter((x): x is FitnessDiscipline => DISCIPLINES.includes(x as FitnessDiscipline));
    const selected = disciplines.length ? disciplines : DISCIPLINES;
    const equipment = Array.isArray(profile.equipment) ? profile.equipment.filter((x): x is string => typeof x === 'string') : [];
    const results = await Promise.all(selected.map((discipline) => this.catalog.list({
      discipline,
      level: 10,
      query: targetArea === 'full_body' ? undefined : targetArea,
      page: 1,
      pageSize: 10,
      equipment,
    })));
    const items = results
      .flatMap((result) => result.items)
      .filter((item) => targetArea === 'full_body' || item.focus.some((focus) => this.normalize(focus).includes(this.normalize(targetArea))))
      .sort((a, b) => a.difficultyLevel - b.difficultyLevel || a.name.localeCompare(b.name))
      .slice(0, 10);

    return {
      targetArea,
      disciplines: selected,
      count: items.length,
      items,
      sourceOfTruth: 'FitnessCatalogService',
      mediaRequirement: '4 approved WebP assets per movement',
    };
  }

  private normalize(value: string): string {
    return value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
}
