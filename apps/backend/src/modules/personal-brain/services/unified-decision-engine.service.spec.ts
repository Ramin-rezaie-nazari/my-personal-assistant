import { UnifiedDecisionEngineService } from './unified-decision-engine.service';

describe('UnifiedDecisionEngineService', () => {
  const service = new UnifiedDecisionEngineService();

  it('selects the strongest cross-domain action', () => {
    const result = service.decide([
      {
        id: 'workout',
        domain: 'workout',
        action: 'train',
        score: 0.9,
        confidence: 0.9,
        priority: 0.7,
      },
      {
        id: 'meal',
        domain: 'nutrition',
        action: 'eat',
        score: 0.8,
        confidence: 0.8,
        priority: 0.6,
      },
      {
        id: 'reminder',
        domain: 'reminder',
        action: 'take',
        score: 0.5,
        confidence: 0.5,
        priority: 0.4,
      },
    ]);
    expect(result.selected[0].id).toBe('workout');
    expect(result.rejected).toHaveLength(2);
  });

  it('lets a hard constraint win even with a weaker soft score', () => {
    const result = service.decide([
      {
        id: 'preferred',
        domain: 'workout',
        action: 'train',
        score: 1,
        confidence: 1,
        priority: 1,
      },
      {
        id: 'calendar',
        domain: 'schedule',
        action: 'attend-meeting',
        score: 0.1,
        confidence: 0.2,
        priority: 0.1,
        hardConstraint: true,
      },
    ]);
    expect(result.selected[0].id).toBe('calendar');
    expect(result.reason).toBe('hard_constraints_take_precedence');
  });

  it('does not select blocked or expired actions', () => {
    const now = new Date('2026-08-12T10:00:00.000Z');
    const result = service.decide(
      [
        {
          id: 'blocked',
          domain: 'notification',
          action: 'push',
          score: 1,
          confidence: 1,
          blockedBy: ['quiet-hours'],
        },
        {
          id: 'expired',
          domain: 'reminder',
          action: 'remind',
          score: 1,
          confidence: 1,
          expiresAt: new Date('2026-08-12T09:00:00.000Z'),
        },
        {
          id: 'valid',
          domain: 'habit',
          action: 'check-in',
          score: 0.5,
          confidence: 0.8,
        },
      ],
      { now },
    );
    expect(result.selected[0].id).toBe('valid');
    expect(result.blocked[0].id).toBe('blocked');
  });

  it('can return more than one action when explicitly requested', () => {
    const result = service.decide(
      [
        { id: 'a', domain: 'habit', action: 'a', score: 0.9, confidence: 0.9 },
        {
          id: 'b',
          domain: 'nutrition',
          action: 'b',
          score: 0.8,
          confidence: 0.8,
        },
      ],
      { maxActions: 2 },
    );
    expect(result.selected.map((item) => item.id)).toEqual(['a', 'b']);
  });
});
