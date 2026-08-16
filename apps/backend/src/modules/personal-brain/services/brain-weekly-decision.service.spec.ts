import { BrainDecisionService } from './brain-decision.service';
import { BrainReasoningContext } from '../types';

const createContext = (): BrainReasoningContext => ({
  input: 'How did I do this week?',
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
      waterMl: 2000,
      calories: 1800,
      protein: 100,
    },
    weeklyStatus: {
      startDateKey: '2026-08-06',
      endDateKey: '2026-08-12',
      days: [],
      loggedDays: 6,
      consistencyPercent: 86,
      totalCalories: 10650,
      totalProtein: 615,
      totalWaterMl: 10700,
      averageCalories: 1521,
      averageProtein: 87.9,
      averageWaterMl: 1529,
      currentStreak: 2,
    },
  },
  signals: {
    hasContext: true,
    hasMemories: false,
    hasGoals: false,
    hasLifeContext: true,
    memoryCount: 0,
    goalCount: 0,
    contextSource: 'test',
    lifeContextQuality: 1,
  },
  reasoning: {
    confidence: 1,
    contextScore: 1,
    uncertainties: [],
    factors: [],
    reasoningSummary: 'weekly context available',
  },
});

describe('BrainDecisionService weekly intent', () => {
  it('answers weekly progress without requiring a primary goal', () => {
    const service = new BrainDecisionService();
    const result = service.evaluateDecision(createContext());

    expect(result).toEqual(
      expect.objectContaining({
        canDecide: true,
        intent: 'weekly-status',
        recommendation:
          'This week: 6/7 days logged (86% consistency), 10650 kcal, 615 g protein, 10700 ml water. Current streak: 2 days.',
        nextAction: 'Review weekly progress and continue logging',
      }),
    );
  });
});
