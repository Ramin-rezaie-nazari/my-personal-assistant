import { BrainDecisionService } from './brain-decision.service';

describe('BrainDecisionService life intents', () => {
  const service = new BrainDecisionService();

  const base = (input: string) => ({
    input,
    userContext: { goals: [{ id: 'g1', category: 'health', title: 'Get healthier', priority: 1 }], memories: [] },
    state: {
      userContext: { goals: [{ id: 'g1', category: 'health', title: 'Get healthier', priority: 1 }], memories: [] },
      context: {}, memories: [], goals: [],
      dailyStatus: { dateKey: '2026-08-12', hasLog: true, waterMl: 1500, calories: 1200, protein: 80 },
      lifeContext: {
        habits: {
          active: 2,
          completedThisWeek: 8,
          completionPercent: 67,
          currentStreak: 4,
          items: [{ id: 'h1', name: 'Walk', targetPerWeek: 7, completedThisWeek: 6, streak: 4 }, { id: 'h2', name: 'Read', targetPerWeek: 7, completedThisWeek: 2, streak: 1 }],
        },
        reminders: { pending: 3, next: { id: 'r1', title: 'Drink water', type: 'health', scheduledAt: '2026-08-12T12:30:00.000Z' } },
        supplements: { total: 2, taken: 1, remaining: 1, completionPercent: 50, next: { id: 's2', name: 'Magnesium', dosage: '200 mg', scheduledTime: '21:00' } },
      },
    },
    signals: { hasContext: true, hasMemories: true, hasGoals: true, memoryCount: 0, goalCount: 1, contextSource: 'test' },
    reasoning: { confidence: 1, uncertainties: [], reasoningSummary: 'complete' },
  }) as never;

  it('answers habit status using streak and completion data', () => {
    const result = service.evaluateDecision(base('How are my habits?'));
    expect(result.intent).toBe('habit-status');
    expect(result.recommendation).toContain('67% completion');
    expect(result.recommendation).toContain('Read');
  });

  it('answers next reminder from the life context', () => {
    const result = service.evaluateDecision(base('What is my next reminder?'));
    expect(result.intent).toBe('reminders');
    expect(result.recommendation).toContain('Drink water');
    expect(result.nextAction).toBe('Complete or review the next reminder');
  });

  it('answers supplement status and next dose', () => {
    const result = service.evaluateDecision(base('Have I taken my supplements?'));
    expect(result.intent).toBe('supplements');
    expect(result.recommendation).toContain('1/2 supplements taken');
    expect(result.recommendation).toContain('Magnesium');
  });
});
