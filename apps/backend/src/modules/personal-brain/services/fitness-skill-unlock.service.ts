import { Injectable } from '@nestjs/common';
import { CalisthenicsLibraryService } from '../../calisthenics/services/calisthenics-library.service';
import { WorkoutPerformanceMemoryService } from './workout-performance-memory.service';

export type SkillUnlockStatus = {
  skillId: string;
  skillName: string;
  status: 'locked' | 'ready' | 'unlocked';
  confidence: number;
  prerequisiteIds: string[];
  missingPrerequisites: string[];
  reason: string;
};

@Injectable()
export class FitnessSkillUnlockService {
  constructor(
    private readonly calisthenicsLibrary: CalisthenicsLibraryService,
    private readonly performanceMemory: WorkoutPerformanceMemoryService,
  ) {}

  async evaluateCalisthenicsSkills(
    userId: string,
    candidateIds?: string[],
  ): Promise<SkillUnlockStatus[]> {
    const memory = await this.performanceMemory.get(userId, 56);
    const exerciseTrends = new Map(
      memory.exerciseTrends.map((item) => [item.exerciseId, item]),
    );
    const candidates = (
      candidateIds?.length
        ? candidateIds
            .map((id) => this.calisthenicsLibrary.get(id))
            .filter(Boolean)
        : [
            'push_up',
            'pistol_squat',
            'handstand',
            'handstand_push_up',
            'l_sit',
            'muscle_up',
            'front_lever_tuck',
          ].map((id) => this.calisthenicsLibrary.get(id))
    ).filter((value): value is NonNullable<typeof value> => Boolean(value));

    return candidates.map((skill) => {
      const prerequisiteIds = skill.regressionId ? [skill.regressionId] : [];
      const prerequisiteResults = prerequisiteIds.map((id) =>
        exerciseTrends.get(id),
      );
      const missingPrerequisites = prerequisiteIds.filter((id, index) => {
        const trend = prerequisiteResults[index];
        return !trend || trend.sessions < 2 || (trend.latestScore ?? 0) < 0.88;
      });

      const ownTrend = exerciseTrends.get(skill.id);
      if (
        ownTrend &&
        ownTrend.sessions >= 2 &&
        (ownTrend.latestScore ?? 0) >= 0.9
      ) {
        return {
          skillId: skill.id,
          skillName: skill.name,
          status: 'unlocked' as const,
          confidence: Math.min(
            0.99,
            0.72 + Math.min(0.2, ownTrend.sessions / 20),
          ),
          prerequisiteIds,
          missingPrerequisites: [],
          reason: 'recent-performance-meets-skill-standard',
        };
      }

      const difficultyGate =
        skill.difficulty >= 8 ? 0.9 : skill.difficulty >= 6 ? 0.86 : 0.82;
      const ready =
        missingPrerequisites.length === 0 &&
        memory.averageRecovery !== null &&
        memory.averageRecovery >= 0.7 &&
        (memory.averageForm ?? 0) >= difficultyGate;

      return {
        skillId: skill.id,
        skillName: skill.name,
        status: ready ? ('ready' as const) : ('locked' as const),
        confidence: ready ? 0.9 : 0.84,
        prerequisiteIds,
        missingPrerequisites,
        reason: ready
          ? 'prerequisites-and-current-performance-are-sufficient'
          : 'prerequisites-or-current-performance-not-yet-sufficient',
      };
    });
  }
}
