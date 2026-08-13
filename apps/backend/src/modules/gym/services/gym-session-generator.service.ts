import { Injectable } from '@nestjs/common';
import { GymEquipment, GymFocus, GymLevel, GymProgress, GymSession } from '../models/gym.model';
import { GymLibraryService } from './gym-library.service';

@Injectable()
export class GymSessionGeneratorService {
  constructor(private readonly library: GymLibraryService) {}

  generate(input: {
    durationMin: number;
    level?: GymLevel;
    focus?: GymFocus;
    equipment?: GymEquipment[];
    progress?: Partial<GymProgress>;
    avoidBulk?: boolean;
  }): GymSession {
    const durationMin = Math.min(120, Math.max(10, Math.round(input.durationMin)));
    const equipment: GymEquipment[] = input.equipment?.length ? input.equipment : ['none'];
    const level = this.adaptLevel(input.level ?? input.progress?.currentLevel ?? 'beginner', input.progress);
    const pool = this.library.list(level, input.focus, equipment);
    const ordered = [...pool].sort((a, b) => Number(b.compound) - Number(a.compound));
    const count = Math.max(3, Math.min(8, Math.floor(durationMin / 8)));
    const selected = ordered.slice(0, count);
    const volumeFactor = input.avoidBulk ? 0.78 : 1;
    const steps = selected.map((exercise, index) => ({
      id: `gym-step-${index + 1}`,
      exerciseId: exercise.id,
      order: index + 1,
      sets: Math.max(2, Math.min(exercise.setsMax, Math.round(exercise.setsMin + (exercise.setsMax - exercise.setsMin) * 0.5 * volumeFactor))),
      repsMin: exercise.repsMin,
      repsMax: exercise.repsMax,
      restSec: input.avoidBulk ? Math.max(45, Math.round(exercise.restSec * 0.82)) : exercise.restSec,
      coachCues: exercise.cues.slice(0, 2),
    }));

    const estimatedDifficulty = selected.length
      ? Number((selected.reduce((sum, item) => sum + (item.level === level ? 0.65 : 0.45) + (item.compound ? 0.15 : 0), 0) / selected.length).toFixed(2))
      : 0;

    return {
      id: `gym-session-${Date.now()}`,
      level,
      focus: input.focus ? [input.focus] : ['full_body'],
      durationMin,
      equipment,
      steps,
      estimatedDifficulty,
    };
  }

  private adaptLevel(level: GymLevel, progress?: Partial<GymProgress>): GymLevel {
    const levels: GymLevel[] = ['beginner','foundation','intermediate','advanced','expert'];
    if (!progress || progress.formScoreAvg == null || progress.completionRate == null) return level;
    const index = levels.indexOf(level);
    if (progress.formScoreAvg >= 0.9 && progress.completionRate >= 0.9 && (progress.recentDifficulty ?? 0) < 0.7) return levels[Math.min(index + 1, levels.length - 1)];
    if (progress.formScoreAvg < 0.65 || progress.completionRate < 0.65) return levels[Math.max(index - 1, 0)];
    return level;
  }
}
