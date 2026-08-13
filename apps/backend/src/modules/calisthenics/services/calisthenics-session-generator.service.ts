import { Injectable } from '@nestjs/common';
import { CalisthenicsFocus, CalisthenicsLevel, CalisthenicsSession, Equipment, CalisthenicsProgress } from '../models/calisthenics.model';
import { CalisthenicsLibraryService } from './calisthenics-library.service';

const levelOrder: CalisthenicsLevel[] = ['beginner','foundation','intermediate','advanced','expert','elite'];

@Injectable()
export class CalisthenicsSessionGeneratorService {
  constructor(private readonly library: CalisthenicsLibraryService) {}

  generate(input: { durationMin: number; level?: CalisthenicsLevel; focus?: CalisthenicsFocus; equipment?: Equipment[]; progress?: Partial<CalisthenicsProgress> }): CalisthenicsSession {
    const equipment: Equipment[] = input.equipment?.length ? input.equipment : ['none'];
    const level = this.adaptLevel(input.level ?? input.progress?.currentLevel ?? 'beginner', input.progress);
    const pool = this.library.list(level, input.focus, equipment);
    const selected = pool.slice(0, Math.max(4, Math.min(8, Math.floor(input.durationMin / 5))));
    const steps = selected.map((exercise, index) => ({
      id: `cal-step-${index + 1}`,
      exerciseId: exercise.id,
      order: index,
      sets: exercise.holdSec ? 2 : 3,
      reps: exercise.holdSec ? null : Math.min(exercise.repsMax ?? 10, Math.max(exercise.repsMin ?? 5, 8)),
      holdSec: exercise.holdSec ? Math.min(exercise.holdSec, 30) : null,
      restSec: exercise.difficulty >= 7 ? 90 : 60,
      coachCues: exercise.cues.slice(0, 2),
    }));

    return {
      id: `cal-session-${Date.now()}`,
      level,
      focus: input.focus ? [input.focus] : ['full_body'],
      durationMin: input.durationMin,
      equipment,
      steps,
      estimatedDifficulty: selected.length ? Number((selected.reduce((sum, item) => sum + item.difficulty, 0) / selected.length).toFixed(2)) : 0,
    };
  }

  private adaptLevel(level: CalisthenicsLevel, progress?: Partial<CalisthenicsProgress>): CalisthenicsLevel {
    if (!progress || progress.formScoreAvg == null || progress.completionRate == null) return level;
    const index = levelOrder.indexOf(level);
    if (progress.formScoreAvg >= 0.9 && progress.completionRate >= 0.9) return levelOrder[Math.min(index + 1, levelOrder.length - 1)];
    if (progress.formScoreAvg < 0.65 || progress.completionRate < 0.65) return levelOrder[Math.max(index - 1, 0)];
    return level;
  }
}
