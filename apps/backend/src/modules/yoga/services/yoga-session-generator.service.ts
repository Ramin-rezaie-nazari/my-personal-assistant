import { Injectable } from '@nestjs/common';
import { YogaFocus, YogaLevel, YogaProgress, YogaSession, YogaSessionStep } from '../models/yoga.model';
import { YogaLibraryService } from './yoga-library.service';

@Injectable()
export class YogaSessionGeneratorService {
  constructor(private readonly library: YogaLibraryService) {}

  generate(input: { durationMin: number; level?: YogaLevel; focus?: YogaFocus; progress?: Partial<YogaProgress> }): YogaSession {
    const durationMin = Math.min(120, Math.max(5, Math.round(input.durationMin)));
    const level = input.level ?? this.recommendLevel(input.progress);
    const focus = input.focus ?? 'mobility';
    const targetSec = durationMin * 60;
    const warmups = this.library.list(level, 'mobility').filter((p) => p.kind === 'standing' || p.kind === 'breathing').slice(0, 2);
    const focused = this.library.list(level, focus).filter((p) => !['relaxation', 'breathing'].includes(p.kind));
    const recovery = this.library.list(level, 'recovery').filter((p) => p.id === 'childs_pose').slice(0, 1);
    const finalRelax = this.library.get('corpse');
    const sequence = [...warmups, ...focused.slice(0, 6), ...recovery, ...(finalRelax ? [finalRelax] : [])];

    const steps: YogaSessionStep[] = [];
    let usedSec = 0;
    for (const [index, pose] of sequence.entries()) {
      const remaining = targetSec - usedSec;
      if (remaining <= 25) break;
      const final = pose.id === 'corpse';
      const holdSec = Math.min(pose.maxHoldSec, Math.max(pose.minHoldSec, final ? Math.min(180, remaining - 10) : Math.round(pose.defaultHoldSec * (1 + this.difficultyAdjustment(input.progress)))));
      const restSec = final ? 0 : Math.min(20, Math.max(5, Math.round(holdSec * 0.15)));
      if (usedSec + holdSec + restSec > targetSec && steps.length) break;
      steps.push({ id: `yoga-step-${index + 1}`, poseId: pose.id, order: index + 1, phase: index < warmups.length ? 'warmup' : final ? 'cooldown' : 'flow', holdSec, restSec, coachCues: pose.cues });
      usedSec += holdSec + restSec;
    }

    return { id: `yoga:${Date.now()}`, level, focus: [focus], durationMin, steps, estimatedDifficulty: Number((steps.reduce((sum, step) => sum + (this.library.get(step.poseId)?.difficulty ?? 0), 0) / Math.max(1, steps.length)).toFixed(2)) };
  }

  private recommendLevel(progress?: Partial<YogaProgress>): YogaLevel {
    if (!progress) return 'beginner';
    if ((progress.completionRate ?? 0) >= 0.9 && (progress.formScoreAvg ?? 0) >= 0.88 && (progress.recentDifficulty ?? 0) < 0.65) return this.nextLevel(progress.currentLevel ?? 'beginner');
    return progress.currentLevel ?? 'beginner';
  }

  private nextLevel(level: YogaLevel): YogaLevel {
    const levels: YogaLevel[] = ['beginner','foundation','intermediate','advanced','expert'];
    return levels[Math.min(levels.length - 1, Math.max(0, levels.indexOf(level) + 1))];
  }

  private difficultyAdjustment(progress?: Partial<YogaProgress>): number {
    if (!progress) return 0;
    if ((progress.formScoreAvg ?? 0) >= 0.92 && (progress.completionRate ?? 0) >= 0.95) return 0.12;
    if ((progress.formScoreAvg ?? 0) < 0.7 || (progress.completionRate ?? 0) < 0.7) return -0.1;
    return 0;
  }
}
