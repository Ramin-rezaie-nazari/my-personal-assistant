import { DecisionScoringService } from './decision-scoring.service';

describe('DecisionScoringService', () => {
  it('ranks highest-scoring action first', () => {
    const service = new DecisionScoringService();
    const result = service.rank([
      { type: 'habit', title: 'Habit', reason: '', score: 40, urgency: 'medium', source: 'habits' },
      { type: 'goal', title: 'Goal', reason: '', score: 80, urgency: 'high', source: 'goals' },
    ]);
    expect(result[0].title).toBe('Goal');
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(2);
  });
});
