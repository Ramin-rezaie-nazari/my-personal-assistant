import { Injectable } from '@nestjs/common';
import {
  ExerciseCandidate,
  RecipeCandidate,
  RecommendationSignals,
  ScoredCandidate,
} from './content.types';

const normalize = (value: string) => value.trim().toLowerCase();

const overlap = (values: string[], preferred: string[]) => {
  const set = new Set(preferred.map(normalize));
  return values.reduce((count, value) => count + (set.has(normalize(value)) ? 1 : 0), 0);
};

@Injectable()
export class ContentRecommendationService {
  rankRecipes(
    candidates: RecipeCandidate[],
    signals: RecommendationSignals,
    limit = 12,
  ): ScoredCandidate<RecipeCandidate>[] {
    return candidates
      .map((candidate) => {
        let score = 0;
        const reasons: string[] = [];

        if (signals.likedContentIds?.includes(candidate.id)) {
          score += 28;
          reasons.push('similar to something you liked');
        }
        if (signals.dislikedContentIds?.includes(candidate.id)) {
          score -= 80;
        }
        if (signals.recentContentIds?.includes(candidate.id)) {
          score -= 18;
        }

        const cuisineMatches = overlap(candidate.cuisines, signals.preferredCuisines ?? []);
        if (cuisineMatches > 0) {
          score += Math.min(30, cuisineMatches * 15);
          reasons.push('matches your food preferences');
        }

        const cuisineDislikes = overlap(candidate.cuisines, signals.dislikedCuisines ?? []);
        score -= cuisineDislikes * 40;

        const countrySignals = [signals.country, signals.originCountry].filter(Boolean) as string[];
        const localMatch = candidate.countries.some((country) => countrySignals.includes(country));
        const originMatch = Boolean(signals.originCountry && candidate.originCountry === signals.originCountry);
        if (originMatch) {
          score += 22;
          reasons.push('connected to your background');
        } else if (localMatch) {
          score += 15;
          reasons.push('fits your local food context');
        }

        const ingredientMatches = overlap(candidate.ingredients, signals.availableIngredients ?? []);
        if (ingredientMatches > 0) {
          score += Math.min(24, ingredientMatches * 6);
          reasons.push('uses ingredients you already have');
        }

        const dietMatches = overlap(candidate.tags, signals.dietaryTags ?? []);
        if (dietMatches > 0) {
          score += Math.min(24, dietMatches * 8);
          reasons.push('fits your nutrition preferences');
        }

        if (signals.difficulty && candidate.difficulty === signals.difficulty) {
          score += 10;
          reasons.push('matches your cooking comfort level');
        }

        if ((candidate.popularityScore ?? 0) > 0) {
          score += Math.min(10, candidate.popularityScore ?? 0);
        }

        // Small exploration bonus prevents the feed from becoming culturally or
        // behaviorally repetitive. It is intentionally capped so relevance wins.
        score += Math.min(8, candidate.cuisines.length);

        return { ...candidate, recommendationScore: Math.round(score * 100) / 100, recommendationReasons: reasons };
      })
      .filter((candidate) => candidate.recommendationScore > -20)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);
  }

  rankExercises(
    candidates: ExerciseCandidate[],
    signals: RecommendationSignals,
    limit = 12,
  ): ScoredCandidate<ExerciseCandidate>[] {
    return candidates
      .map((candidate) => {
        let score = 0;
        const reasons: string[] = [];

        if (signals.likedContentIds?.includes(candidate.id)) {
          score += 30;
          reasons.push('similar to a workout you liked');
        }
        if (signals.dislikedContentIds?.includes(candidate.id)) score -= 80;
        if (signals.recentContentIds?.includes(candidate.id)) score -= 18;

        const equipmentMatches = overlap(candidate.equipment, signals.availableEquipment ?? []);
        if (candidate.equipment.length === 0 || equipmentMatches === candidate.equipment.length) {
          score += 18;
          reasons.push('works with your available equipment');
        } else if (equipmentMatches > 0) {
          score += 8;
        } else {
          score -= 22;
        }

        const goalMatches = overlap(candidate.goals ?? [], signals.goals ?? []);
        if (goalMatches > 0) {
          score += Math.min(32, goalMatches * 16);
          reasons.push('matches your fitness goal');
        }

        if (signals.difficulty && candidate.difficulty === signals.difficulty) {
          score += 12;
          reasons.push('matches your current level');
        }

        if (signals.preferredCuisines?.some((value) => normalize(value) === normalize(candidate.discipline))) {
          score += 4;
        }

        score += Math.min(10, candidate.popularityScore ?? 0);

        return { ...candidate, recommendationScore: Math.round(score * 100) / 100, recommendationReasons: reasons };
      })
      .filter((candidate) => candidate.recommendationScore > -20)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);
  }
}
