import { Injectable } from '@nestjs/common';
import { YogaSessionGeneratorService } from '../../yoga/services/yoga-session-generator.service';
import { CalisthenicsSessionGeneratorService } from '../../calisthenics/services/calisthenics-session-generator.service';
import { GymSessionGeneratorService } from '../../gym/services/gym-session-generator.service';
import { FitnessDecisionPolicyService } from './fitness-decision-policy.service';
import { BrainReasoningContext } from '../types';

export type FitnessSessionRequest = {
  durationMin: number;
  level?: string;
  focus?: string;
};

@Injectable()
export class FitnessSessionOrchestratorService {
  constructor(
    private readonly policy: FitnessDecisionPolicyService,
    private readonly yoga: YogaSessionGeneratorService,
    private readonly calisthenics: CalisthenicsSessionGeneratorService,
    private readonly gym: GymSessionGeneratorService,
  ) {}

  generate(context: BrainReasoningContext, request: FitnessSessionRequest) {
    const decision = this.policy.evaluate(context);
    if (!decision || decision.intent !== 'fitness-recommendation') {
      return { status: 'not-applicable' as const, decision };
    }

    const recommendation = decision.recommendation.toLowerCase();
    const discipline = recommendation.includes('yoga')
      ? 'yoga'
      : recommendation.includes('calisthenics')
        ? 'calisthenics'
        : 'gym';
    const fitness = context.state.lifeContext?.fitness;
    const equipment = fitness?.equipment ?? ['none'];
    const avoidBulk = Boolean(fitness?.primaryGoal?.avoidBulk);

    if (discipline === 'yoga') {
      const session = this.yoga.generate({
        durationMin: request.durationMin,
        level: this.isYogaLevel(request.level) ? request.level : undefined,
        focus: this.isYogaFocus(request.focus) ? request.focus : undefined,
      });
      return { status: 'generated' as const, discipline, decision, session };
    }

    if (discipline === 'calisthenics') {
      const mappedEquipment = equipment.filter((value): value is Parameters<CalisthenicsSessionGeneratorService['generate']>[0]['equipment'][number] =>
        ['none', 'pull_up_bar', 'parallel_bars', 'rings', 'bench', 'resistance_band', 'dip_belt'].includes(value),
      );
      const session = this.calisthenics.generate({
        durationMin: request.durationMin,
        level: this.isCalisthenicsLevel(request.level) ? request.level : undefined,
        focus: this.isCalisthenicsFocus(request.focus) ? request.focus : undefined,
        equipment: mappedEquipment.length ? mappedEquipment : ['none'],
      });
      return { status: 'generated' as const, discipline, decision, session };
    }

    const mappedGymEquipment = equipment.filter((value): value is Parameters<GymSessionGeneratorService['generate']>[0]['equipment'][number] =>
      ['none', 'dumbbells', 'barbell', 'bench', 'cable_machine', 'machine', 'pull_up_bar', 'smith_machine', 'resistance_band', 'kettlebell'].includes(value),
    );
    const session = this.gym.generate({
      durationMin: request.durationMin,
      level: this.isGymLevel(request.level) ? request.level : undefined,
      focus: this.isGymFocus(request.focus) ? request.focus : undefined,
      equipment: mappedGymEquipment.length ? mappedGymEquipment : ['none'],
      avoidBulk,
    });
    return { status: 'generated' as const, discipline, decision, session };
  }

  private isYogaLevel(value?: string): value is Parameters<YogaSessionGeneratorService['generate']>[0]['level'] {
    return ['beginner', 'foundation', 'intermediate', 'advanced', 'expert'].includes(value ?? '');
  }

  private isYogaFocus(value?: string): value is Parameters<YogaSessionGeneratorService['generate']>[0]['focus'] {
    return ['mobility', 'flexibility', 'balance', 'strength', 'recovery', 'relaxation', 'stress_relief', 'morning', 'evening', 'breathing'].includes(value ?? '');
  }

  private isCalisthenicsLevel(value?: string): value is Parameters<CalisthenicsSessionGeneratorService['generate']>[0]['level'] {
    return ['beginner', 'foundation', 'intermediate', 'advanced', 'expert', 'elite'].includes(value ?? '');
  }

  private isCalisthenicsFocus(value?: string): value is Parameters<CalisthenicsSessionGeneratorService['generate']>[0]['focus'] {
    return ['strength', 'hypertrophy', 'conditioning', 'mobility', 'skills', 'full_body', 'upper_body', 'lower_body', 'core'].includes(value ?? '');
  }

  private isGymLevel(value?: string): value is Parameters<GymSessionGeneratorService['generate']>[0]['level'] {
    return ['beginner', 'foundation', 'intermediate', 'advanced', 'expert'].includes(value ?? '');
  }

  private isGymFocus(value?: string): value is Parameters<GymSessionGeneratorService['generate']>[0]['focus'] {
    return ['strength', 'hypertrophy', 'fat_loss', 'body_sculpt', 'upper_body', 'lower_body', 'full_body', 'shoulders', 'back', 'chest', 'arms', 'legs', 'glutes', 'core'].includes(value ?? '');
  }
}
