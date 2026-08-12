import { BrainDecisionService } from './brain-decision.service';
import { BrainReasoningContext } from '../types';

const createContext = (
  input: string,
  hasLog = true,
): BrainReasoningContext => ({
  input,
  userContext: {
    goals: [
      {
        id: 'goal-1',
        category: 'health',
        title: 'Lose 5 kg',
        priority: 1,
      },
    ],
    memories: [],
  },
  state: {
    userContext: {
      goals: [
        {
          id: 'goal-1',
          category: 'health',
          title: 'Lose 5 kg',
          priority: 1,
        },
      ],
      memories: [],
    },
    context: {},
    memories: [],
    goals: [],
    dailyStatus: {
      dateKey: '2026-08-12',
      hasLog,
      waterMl: 1800,
      calories: 1450,
      protein: 95,
    },
  },
  signals: {
    hasContext: true,
    hasMemories: true,
    hasGoals: true,
    memoryCount: 0,
    goalCount: 1,
    contextSource: 'test',
  },
  reasoning: {
    confidence: 1,
    uncertainties: [],
    reasoningSummary: 'complete',
  },
});

describe('BrainDecisionService', () => {
  it('answers a direct question about the current primary goal', () => {
    const service = new BrainDecisionService();

    const result = service.evaluateDecision(createContext("What's my goal?"));

    expect(result).toEqual(
      expect.objectContaining({
        canDecide: true,
        intent: 'goal',
        recommendation: 'Your current primary goal is: Lose 5 kg',
        nextAction: 'Use primary goal as personal context',
      }),
    );
  });

  it('keeps the existing goal-guidance behavior for non-goal questions', () => {
    const service = new BrainDecisionService();

    const result = service.evaluateDecision(createContext('help me plan today'));

    expect(result).toEqual(
      expect.objectContaining({
        intent: 'health',
        recommendation: 'Support user goal: Lose 5 kg',
        nextAction: 'Provide goal-specific guidance',
      }),
    );
  });

  it('answers today progress from daily status without requiring goal blockers', () => {
    const service = new BrainDecisionService();
    const context = createContext('How am I doing today?');
    context.reasoning.uncertainties = ['missing-goals'];

    const result = service.evaluateDecision(context);

    expect(result).toEqual(
      expect.objectContaining({
        canDecide: true,
        intent: 'daily-status',
        recommendation: 'Today: 1450 kcal, 95 g protein, 1800 ml water.',
        nextAction: 'Review today and continue logging',
      }),
    );
    expect(result.blockers).not.toContain('missing-goals');
  });

  it('suggests starting the daily log when there is no log yet', () => {
    const service = new BrainDecisionService();

    const result = service.evaluateDecision(
      createContext("How's my day going?", false),
    );

    expect(result).toEqual(
      expect.objectContaining({
        intent: 'daily-status',
        recommendation: expect.stringContaining('do not have a daily log'),
        nextAction: 'Log today activity',
      }),
    );
  });
});
