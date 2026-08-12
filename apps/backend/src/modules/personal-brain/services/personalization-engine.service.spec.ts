import { PersonalizationEngineService } from './personalization-engine.service';

describe('PersonalizationEngineService', () => {
  it('blends repeated behavioral signals and keeps confidence', () => {
    const service = new PersonalizationEngineService();
    service.upsertSignal('u1', 'notification', { key: 'preferred_channel.push', value: 'push', score: 0.9, confidence: 0.8 });
    const result = service.upsertSignal('u1', 'workout', { key: 'preferred_time.morning', value: 'morning', score: 0.7, confidence: 0.6 });
    expect(result.score).toBeCloseTo(0.7);
    expect(service.getProfile('u1').signals['notification.preferred_channel.push'].score).toBeCloseTo(0.9);
  });

  it('returns null for unknown preferences', () => {
    const service = new PersonalizationEngineService();
    expect(service.getSignal('u1', 'nutrition', 'spicy')).toBeNull();
  });
});
