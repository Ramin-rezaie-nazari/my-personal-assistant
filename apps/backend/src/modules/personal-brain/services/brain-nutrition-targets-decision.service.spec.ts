import { BrainDecisionService } from './brain-decision.service';
import { BrainReasoningContext } from '../types';

describe('BrainDecisionService nutrition target intent', () => {
  it('reports remaining daily nutrition targets', () => {
    const service = new BrainDecisionService();
    const context = {
      input: 'Am I on track today?',
      userContext: { goals: [], memories: [] },
      state: {
        userContext: { goals: [], memories: [] },
        context: {},
        memories: [],
        goals: [],
        dailyStatus: {
          dateKey: '2026-08-12',
          hasLog: true,
          waterMl: 1800,
          calories: 1450,
          protein: 95,
        },
        weeklyStatus: undefined,
        nutritionTargets: {
          hasTargets: true,
          dailyCaloriesGoal: 2000,
          proteinGoalGrams: 120,
          waterGoalMl: 2500,
        },
      },
      signals: {
        hasContext: true,
        hasMemories: false,
        hasGoals: false,
        memoryCount: 0,
        goalCount: 0,
        contextSource: 'test',
      },
      reasoning: {
        confidence: 1,
        uncertainties: [],
        reasoningSummary: 'targets available',
      },
    } as BrainReasoningContext;

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
    const context = {
      input: 'How am I doing with my nutrition?',
      userContext: { goals: [], memories: [] },
      state: {
        userContext: { goals: [], memories: [] },
        context: {},
        memories: [],
        goals: [],
        dailyStatus: {
          dateKey: '2026-08-12',
          hasLog: true,
          waterMl: 1800,
          calories: 1450,
          protein: 95,
        },
        nutritionTargets: { hasTargets: false },
      },
      signals: {
        hasContext: true,
        hasMemories: false,
        hasGoals: false,
        memoryCount: 0,
        goalCount: 0,
        contextSource: 'test',
      },
      reasoning: {
        confidence: 1,
        uncertainties: [],
        reasoningSummary: 'missing targets',
      },
    } as BrainReasoningContext;

    const result = service.evaluateDecision(context);

    expect(result).toEqual(
      expect.objectContaining({
        intent: 'nutrition-targets',
        nextAction: 'Set nutrition targets',
      }),
    );
  });
});
