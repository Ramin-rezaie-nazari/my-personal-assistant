import { FitnessSessionOrchestratorService } from './fitness-session-orchestrator.service';
import { BrainReasoningContext } from '../types';

describe('FitnessSessionOrchestratorService', () => {
  const context = (discipline: string, equipment: string[]) => ({
    input: 'workout today',
    userContext: { goals: [], preferences: {} },
    state: { lifeContext: { fitness: { disciplines: [discipline], primaryGoal: { kind: 'body_sculpt', targetAreas: ['thighs'], avoidBulk: true }, equipment, constraints: [] } } },
    signals: {} as any,
    reasoning: { uncertainties: [], confidence: 0.9 } as any,
  }) as BrainReasoningContext;

  it('generates calisthenics when bodyweight-only context wins', () => {
    const policy = { evaluate: () => ({ intent: 'fitness-recommendation', recommendation: 'Best training branch today: calisthenics', confidence: 0.9, blockers: [], canDecide: true }) } as any;
    const yoga = { generate: jest.fn() } as any;
    const calisthenics = { generate: jest.fn(() => ({ id: 'cal-1' })) } as any;
    const gym = { generate: jest.fn() } as any;
    const service = new FitnessSessionOrchestratorService(policy, yoga, calisthenics, gym);
    const result = service.generate(context('calisthenics', ['none']), { durationMin: 30 });
    expect(result.status).toBe('generated');
    expect(result.discipline).toBe('calisthenics');
    expect(calisthenics.generate).toHaveBeenCalled();
  });

  it('generates yoga when policy selects yoga', () => {
    const policy = { evaluate: () => ({ intent: 'fitness-recommendation', recommendation: 'Best training branch today: yoga', confidence: 0.9, blockers: [], canDecide: true }) } as any;
    const yoga = { generate: jest.fn(() => ({ id: 'yoga-1' })) } as any;
    const calisthenics = { generate: jest.fn() } as any;
    const gym = { generate: jest.fn() } as any;
    const service = new FitnessSessionOrchestratorService(policy, yoga, calisthenics, gym);
    const result = service.generate(context('yoga', ['yoga_mat']), { durationMin: 45 });
    expect(result.status).toBe('generated');
    expect(result.discipline).toBe('yoga');
    expect(yoga.generate).toHaveBeenCalled();
  });

  it('generates gym when policy selects gym', () => {
    const policy = { evaluate: () => ({ intent: 'fitness-recommendation', recommendation: 'Best training branch today: gym', confidence: 0.9, blockers: [], canDecide: true }) } as any;
    const yoga = { generate: jest.fn() } as any;
    const calisthenics = { generate: jest.fn() } as any;
    const gym = { generate: jest.fn(() => ({ id: 'gym-1' })) } as any;
    const service = new FitnessSessionOrchestratorService(policy, yoga, calisthenics, gym);
    const result = service.generate(context('gym', ['dumbbells']), { durationMin: 45 });
    expect(result.status).toBe('generated');
    expect(result.discipline).toBe('gym');
    expect(gym.generate).toHaveBeenCalledWith(expect.objectContaining({ equipment: ['dumbbells'], avoidBulk: true }));
  });
});
