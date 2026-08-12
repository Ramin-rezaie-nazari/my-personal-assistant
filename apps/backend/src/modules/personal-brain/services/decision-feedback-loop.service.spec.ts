import { DecisionFeedbackLoopService } from './decision-feedback-loop.service';

describe('DecisionFeedbackLoopService', () => {
  it('turns completion into a positive personalization signal', () => {
    const signals: unknown[] = [];
    const service = new DecisionFeedbackLoopService({ upsertSignal: (_userId: string, _domain: string, signal: unknown) => { signals.push(signal); return signal; } } as never);
    const result = service.record({ userId: 'u1', candidate: { id: '1', domain: 'workout', action: 'train', score: 0.8, confidence: 0.9 }, outcome: 'completed' });
    expect(result.reward).toBe(1);
    expect(signals).toHaveLength(1);
  });

  it('preserves negative dismissal feedback', () => {
    const signals: any[] = [];
    const service = new DecisionFeedbackLoopService({ upsertSignal: (_userId: string, _domain: string, signal: any) => { signals.push(signal); return signal; } } as never);
    service.record({ userId: 'u1', candidate: { id: '2', domain: 'notification', action: 'push', score: 0.7, confidence: 0.8 }, outcome: 'dismissed' });
    expect(signals[0].score).toBe(-0.45);
    expect(signals[0].source).toBe('decision-feedback');
  });
});
