import { DecisionFeedbackLoopService } from './decision-feedback-loop.service';

describe('DecisionFeedbackLoopService', () => {
  it('turns completion into a positive personalization and learning signal', async () => {
    const signals: any[] = [];
    const learning: any[] = [];
    const service = new DecisionFeedbackLoopService(
      {
        upsertSignal: (_userId: string, _domain: string, signal: any) => {
          signals.push(signal);
          return signal;
        },
      } as never,
      {
        record: jest.fn().mockImplementation(async (input) => {
          learning.push(input);
          return { id: 'outcome-1', ...input };
        }),
      } as never,
    );

    const result = await service.record({
      userId: 'u1',
      candidate: {
        id: '1',
        domain: 'workout',
        action: 'train',
        score: 0.8,
        confidence: 0.9,
      },
      outcome: 'completed',
    });

    expect(result.reward).toBe(1);
    expect(signals).toHaveLength(1);
    expect(learning[0]).toMatchObject({
      userId: 'u1',
      decisionId: '1',
      outcome: 'positive',
      score: 1,
      source: 'behavior',
    });
  });

  it('preserves negative dismissal feedback in both learning paths', async () => {
    const signals: any[] = [];
    const learning: any[] = [];
    const service = new DecisionFeedbackLoopService(
      {
        upsertSignal: (_userId: string, _domain: string, signal: any) => {
          signals.push(signal);
          return signal;
        },
      } as never,
      {
        record: jest.fn().mockImplementation(async (input) => {
          learning.push(input);
          return { id: 'outcome-2', ...input };
        }),
      } as never,
    );

    await service.record({
      userId: 'u1',
      candidate: {
        id: '2',
        domain: 'notification',
        action: 'push',
        score: 0.7,
        confidence: 0.8,
      },
      outcome: 'dismissed',
    });

    expect(signals[0].score).toBe(-0.45);
    expect(signals[0].source).toBe('decision-feedback');
    expect(learning[0]).toMatchObject({
      decisionId: '2',
      outcome: 'negative',
      score: -0.45,
      source: 'behavior',
    });
  });
});
