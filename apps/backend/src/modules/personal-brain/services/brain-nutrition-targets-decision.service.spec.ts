import { BrainDecisionService } from './brain-decision.service';
import { BrainReasoningContext } from '../types';

const baseContext = {
  userContext: {
    profile: {},
    lifeAreas: ['health'],
    preferences: {},
    constraints: [],
    goals: [],
  },
  state: {
    userContext: {
      profile: {},
      lifeAreas: ['health'],
      preferences: {},
      constraints: [],
      goals: [],
    },
    context: {
      timestamp: '2026-08-12T00:00:00.000Z',
      source: 'test',
    },
    memories: [],
    goals: [],
    dailyStatus: {
      dateKey: '2026-08-12',
      hasLog: true,
      waterMl: 1800,
      calories: 1450,
      protein: 95,
    },
  },
  signals: {
    hasContext: true,
    hasMemories: false,
    hasGoals: false,
    hasLifeContext: false,
    memoryCount: 0,
    goalCount: 0,
    contextSource: 'test',
    lifeContextQuality: 0,
  },
  reasoning: {
    confidence: 1,
    contextScore: 1,
    uncertainties: [],
    factors: [],
    reasoningSummary: 'test',
  },
} satisfies Omit<BrainReasoningContext, 'input'>;

describe('BrainDecisionService nutrition target intent', () => {
  it('reports remaining daily nutrition targets', () => {
    const service = new BrainDecisionService();

    const context: BrainReasoningContext = {
      input: 'Am I on track today?',
      ...baseContext,
      state: {
        ...baseContext.state,
        nutritionTargets: {
          hasTargets: true,
          dailyCaloriesGoal: 2000,
          proteinGoalGrams: 120,
          waterGoalMl: 2500,
        },
      },
    };

    const result = service.evaluateDecision(context);

    expect(result).toEqual(
      expect.objectContaining({
        canDecide: true,
        intent: 'nutrition-targets',
        recommendation:
          'Today: 1450/2000 kcal, 95/120 g protein, 1800/2500 ml water. Remaining: 550 kcal, 25 g protein, 700 ml water.',
        nextAction: 'Continue logging against today targets',
      }),
    );
  });

  it('asks the user to set targets when no nutrition targets exist', () => {
    const service = new BrainDecisionService();

    const context: BrainReasoningContext = {
      input: 'How am I doing with my nutrition?',
      ...baseContext,
      state: {
        ...baseContext.state,
        nutritionTargets: { hasTargets: false },
      },
    };

    const result = service.evaluateDecision(context);

    expect(result).toEqual(
      expect.objectContaining({
        intent: 'nutrition-targets',
        nextAction: 'Set nutrition targets',
      }),
    );
  });
});
