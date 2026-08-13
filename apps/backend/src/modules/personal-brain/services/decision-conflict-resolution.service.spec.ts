import { DecisionConflictResolutionService } from './decision-conflict-resolution.service';
import { DecisionCandidate } from './unified-decision-engine.service';

describe('DecisionConflictResolutionService', () => {
  const service = new DecisionConflictResolutionService();

  it('prefers the higher-utility action when two actions overlap in time', () => {
    const candidates: DecisionCandidate[] = [
      { id: 'workout', domain: 'workout', action: 'start_workout', score: 0.9, confidence: 0.9, priority: 0.8, startAt: new Date('2026-08-13T18:00:00Z'), durationMinutes: 60 },
      { id: 'meeting', domain: 'schedule', action: 'attend_meeting', score: 0.7, confidence: 0.8, priority: 0.6, startAt: new Date('2026-08-13T18:30:00Z'), durationMinutes: 60 },
    ];
    const result = service.resolve(candidates);
    expect(result.conflicts).toHaveLength(1);
    expect(result.candidates.map((candidate) => candidate.id)).toEqual(['workout']);
    expect(result.rationale[0]).toContain('meeting');
  });

  it('detects budget pressure when shopping decisions compete', () => {
    const candidates: DecisionCandidate[] = [
      { id: 'shopping-a', domain: 'shopping', action: 'buy', score: 0.7, confidence: 0.8, priority: 0.6 },
      { id: 'shopping-b', domain: 'shopping', action: 'buy', score: 0.6, confidence: 0.8, priority: 0.5 },
    ];
    const result = service.resolve(candidates, { budgetPressure: true });
    expect(result.conflicts[0]?.type).toBe('budget');
  });
});
