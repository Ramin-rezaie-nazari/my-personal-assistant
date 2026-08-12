import { BrainDecisionService } from './brain-decision.service';
import { BrainReasoningContext } from '../types';

const createContext = (input: string): BrainReasoningContext => ({
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
});
