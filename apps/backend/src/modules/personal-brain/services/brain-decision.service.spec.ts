import { BrainDecisionService } from './brain-decision.service';
import { BrainReasoningContext } from '../types';

const createContext = (
  input: string,
  hasLog = true,
): BrainReasoningContext => ({
  input,
  userContext: {
    profile: {},
    lifeAreas: ['health'],
    preferences: {},
    constraints: [],
    goals: [
      {
        id: 'goal-1',
        category: 'health',
        title: 'Lose 5 kg',
        priority: 1,
      },
    ],
  },
  state: {
    userContext: {
      profile: {},
      lifeAreas: ['health'],
      preferences: {},
      constraints: [],
      goals: [
        {
          id: 'goal-1',
          category: 'health',
          title: 'Lose 5 kg',
          priority: 1,
        },
      ],
    },
    context: { timestamp: '2026-08-12T00:00:00.000Z', source: 'test' },
    memories: [],
    goals: [],
    dailyStatus: {
      dateKey: '2026-08-12',
      hasLog,
      waterMl: 1800,
      calories: 1450,
      protein: 95,
    },
    workoutStatus: {
      fromDateKey: '2026-08-06',
      toDateKey: '2026-08-12',
      workoutCount: 3,
      activeDays: 2,
      totalMinutes: 100,
      totalCaloriesBurned: 640,
      averageMinutesPerWorkout: 33,
      consistencyPercent: 29,
      currentStreak: 2,
      lastWorkout: {
        name: 'Morning Run',
        type: 'cardio',
        performedAt: '2026-08-12T08:00:00.000Z',
      },
    },
  },
  signals: {
    hasContext: true,
    hasMemories: true,
    hasGoals: true,
    hasLifeContext: true,
    memoryCount: 0,
    goalCount: 1,
    contextSource: 'test',
    lifeContextQuality: 1,
  },
  reasoning: {
    confidence: 1,
    contextScore: 1,
    uncertainties: [],
    factors: [],
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

    const result = service.evaluateDecision(
      createContext('help me plan today'),
    );

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

  it('answers weekly workout progress with consistency and recent activity', () => {
    const service = new BrainDecisionService();

    const result = service.evaluateDecision(
      createContext('How am I doing with exercise?'),
    );

    expect(result).toEqual(
      expect.objectContaining({
        canDecide: true,
        intent: 'workout-status',
        recommendation: expect.stringContaining(
          '3 workouts across 2 active days',
        ),
        nextAction: 'Keep training and continue logging workouts',
      }),
    );
  });
});
