import { Injectable, Optional } from '@nestjs/common';
import { YogaSessionGeneratorService } from '../../yoga/services/yoga-session-generator.service';
import { CalisthenicsSessionGeneratorService } from '../../calisthenics/services/calisthenics-session-generator.service';
import { GymSessionGeneratorService } from '../../gym/services/gym-session-generator.service';
import { FitnessDecisionPolicyService } from './fitness-decision-policy.service';
import {
  FitnessPerformanceSnapshot,
  FitnessProgressionService,
} from './fitness-progression.service';
import { BrainReasoningContext } from '../types';
import { Equipment as CalisthenicsEquipment } from '../../calisthenics/models/calisthenics.model';
import { GymEquipment } from '../../gym/models/gym.model';

export type FitnessSessionRequest = {
  durationMin: number;
  level?: string;
  focus?: string;
  performance?: FitnessPerformanceSnapshot;
};

@Injectable()
export class FitnessSessionOrchestratorService {
  constructor(
    private readonly policy: FitnessDecisionPolicyService,
    private readonly yoga: YogaSessionGeneratorService,
    private readonly calisthenics: CalisthenicsSessionGeneratorService,
    private readonly gym: GymSessionGeneratorService,
    @Optional() private readonly progression?: FitnessProgressionService,
  ) {}

  generate(context: BrainReasoningContext, request: FitnessSessionRequest) {
    const decision = this.policy.evaluate(context);
    if (!decision || decision.intent !== 'fitness-recommendation')
      return { status: 'not-applicable' as const, decision };

    const progression = (
      this.progression ?? new FitnessProgressionService()
    ).evaluate(request.performance);
    const effectiveDuration = Math.max(
      5,
      Math.round(request.durationMin * progression.volumeMultiplier),
    );
    const recommendation = (decision.recommendation ?? '').toLowerCase();
    const discipline = recommendation.includes('yoga')
      ? 'yoga'
      : recommendation.includes('calisthenics')
        ? 'calisthenics'
        : 'gym';
    const equipment = context.state.lifeContext?.fitness?.equipment ?? ['none'];
    const avoidBulk =
      Boolean(context.state.lifeContext?.fitness?.primaryGoal?.avoidBulk) ||
      progression.action === 'deload';

    if (discipline === 'yoga') {
      const level = this.isYogaLevel(request.level) ? request.level : undefined;
      const session = this.yoga.generate({
        durationMin: effectiveDuration,
        level,
        focus: this.isYogaFocus(request.focus) ? request.focus : undefined,
        progress: {
          currentLevel: level,
          formScoreAvg: request.performance?.formScoreAvg,
          completionRate: request.performance?.completionRate,
          recentDifficulty: request.performance?.recentDifficulty,
        },
      });
      return {
        status: 'generated' as const,
        discipline,
        decision,
        progression,
        session,
      };
    }

    if (discipline === 'calisthenics') {
      const mappedEquipment = equipment.filter(
        (value): value is CalisthenicsEquipment =>
          (
            [
              'none',
              'pull_up_bar',
              'parallel_bars',
              'rings',
              'bench',
              'resistance_band',
              'dip_belt',
              'wall',
            ] as string[]
          ).includes(value),
      );
      const level = this.isCalisthenicsLevel(request.level)
        ? request.level
        : undefined;
      const session = this.calisthenics.generate({
        durationMin: effectiveDuration,
        level,
        focus: this.isCalisthenicsFocus(request.focus)
          ? request.focus
          : undefined,
        equipment: mappedEquipment.length ? mappedEquipment : ['none'],
        progress: {
          currentLevel: level,
          formScoreAvg: request.performance?.formScoreAvg,
          completionRate: request.performance?.completionRate,
        },
      });
      return {
        status: 'generated' as const,
        discipline,
        decision,
        progression,
        session,
      };
    }

    const mappedGymEquipment = equipment.filter(
      (value): value is GymEquipment =>
        (
          [
            'none',
            'dumbbells',
            'barbell',
            'bench',
            'cable_machine',
            'machine',
            'pull_up_bar',
            'smith_machine',
            'resistance_band',
            'kettlebell',
          ] as string[]
        ).includes(value),
    );
    const level = this.isGymLevel(request.level) ? request.level : undefined;
    const session = this.gym.generate({
      durationMin: effectiveDuration,
      level,
      focus: this.isGymFocus(request.focus) ? request.focus : undefined,
      equipment: mappedGymEquipment.length ? mappedGymEquipment : ['none'],
      avoidBulk,
      progress: {
        currentLevel: level,
        formScoreAvg: request.performance?.formScoreAvg,
        completionRate: request.performance?.completionRate,
        recentDifficulty: request.performance?.recentDifficulty,
      },
    });
    return {
      status: 'generated' as const,
      discipline,
      decision,
      progression,
      session,
    };
  }

  private isYogaLevel(
    value?: string,
  ): value is Parameters<YogaSessionGeneratorService['generate']>[0]['level'] {
    return [
      'beginner',
      'foundation',
      'intermediate',
      'advanced',
      'expert',
    ].includes(value ?? '');
  }
  private isYogaFocus(
    value?: string,
  ): value is Parameters<YogaSessionGeneratorService['generate']>[0]['focus'] {
    return [
      'mobility',
      'flexibility',
      'balance',
      'strength',
      'recovery',
      'relaxation',
      'stress_relief',
      'morning',
      'evening',
      'breathing',
    ].includes(value ?? '');
  }
  private isCalisthenicsLevel(
    value?: string,
  ): value is Parameters<
    CalisthenicsSessionGeneratorService['generate']
  >[0]['level'] {
    return [
      'beginner',
      'foundation',
      'intermediate',
      'advanced',
      'expert',
      'elite',
    ].includes(value ?? '');
  }
  private isCalisthenicsFocus(
    value?: string,
  ): value is Parameters<
    CalisthenicsSessionGeneratorService['generate']
  >[0]['focus'] {
    return [
      'strength',
      'hypertrophy',
      'conditioning',
      'mobility',
      'skills',
      'full_body',
      'upper_body',
      'lower_body',
      'core',
      'balance',
    ].includes(value ?? '');
  }
  private isGymLevel(
    value?: string,
  ): value is Parameters<GymSessionGeneratorService['generate']>[0]['level'] {
    return [
      'beginner',
      'foundation',
      'intermediate',
      'advanced',
      'expert',
    ].includes(value ?? '');
  }
  private isGymFocus(
    value?: string,
  ): value is Parameters<GymSessionGeneratorService['generate']>[0]['focus'] {
    return [
      'strength',
      'hypertrophy',
      'fat_loss',
      'body_sculpt',
      'upper_body',
      'lower_body',
      'full_body',
      'shoulders',
      'back',
      'chest',
      'arms',
      'legs',
      'glutes',
      'core',
    ].includes(value ?? '');
  }
}
