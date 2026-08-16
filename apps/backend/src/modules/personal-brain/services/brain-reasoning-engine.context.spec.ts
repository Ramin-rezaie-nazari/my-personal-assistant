import { BrainReasoningEngineService } from './brain-reasoning-engine.service';

const baseUserContext = {
  goals: [{ id: 'g1', title: 'Launch app' }],
  memories: [],
  preferences: [],
} as any;

describe('BrainReasoningEngineService context-aware reasoning', () => {
  it('raises confidence when life context is rich and actionable', () => {
    const service = new BrainReasoningEngineService();
    const result = service.analyze({
      input: 'What should I focus on today?',
      userContext: baseUserContext,
      signals: {
        hasContext: true,
        hasMemories: true,
        hasGoals: true,
        hasLifeContext: true,
        memoryCount: 4,
        goalCount: 1,
        contextSource: 'personal',
        lifeContextQuality: 0.9,
      },
      lifeContext: {
        habits: {
          active: 2,
          completedThisWeek: 8,
          completionPercent: 100,
          currentStreak: 5,
          items: [],
        },
        reminders: { pending: 1, next: null },
        supplements: {
          total: 1,
          taken: 1,
          remaining: 0,
          completionPercent: 100,
          next: null,
        },
        goals: {
          active: 1,
          dueSoon: 1,
          averageProgress: 70,
          next: null,
          items: [],
        },
        fitness: {
          disciplines: [],
          primaryGoal: null,
          equipment: [],
          constraints: [],
          targetAreas: [],
        },
      },
    });

    expect(result.confidence).toBeGreaterThan(0.85);
    expect(result.contextScore).toBeGreaterThan(0.9);
    expect(
      result.factors.some((factor) => factor.name === 'goal_urgency'),
    ).toBe(true);
  });

  it('penalizes heavy reminder load while retaining the context', () => {
    const service = new BrainReasoningEngineService();
    const result = service.analyze({
      input: 'What should I do next?',
      userContext: baseUserContext,
      signals: {
        hasContext: true,
        hasMemories: true,
        hasGoals: true,
        hasLifeContext: true,
        memoryCount: 2,
        goalCount: 1,
        contextSource: 'personal',
        lifeContextQuality: 0.9,
      },
      lifeContext: {
        habits: {
          active: 2,
          completedThisWeek: 4,
          completionPercent: 50,
          currentStreak: 1,
          items: [],
        },
        reminders: { pending: 9, next: null },
        supplements: {
          total: 0,
          taken: 0,
          remaining: 0,
          completionPercent: 0,
          next: null,
        },
        goals: {
          active: 1,
          dueSoon: 0,
          averageProgress: 40,
          next: null,
          items: [],
        },
        fitness: {
          disciplines: [],
          primaryGoal: null,
          equipment: [],
          constraints: [],
          targetAreas: [],
        },
      },
    });

    expect(
      result.factors.some((factor) => factor.name === 'reminder_load'),
    ).toBe(true);
    expect(
      result.factors.some((factor) => factor.name === 'habit_adherence'),
    ).toBe(true);
    expect(result.contextScore).toBeLessThan(0.9);
  });
});
