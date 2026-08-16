import { NotificationAdaptationService } from './notification-adaptation.service';

describe('NotificationAdaptationService', () => {
  const service = new NotificationAdaptationService();
  it('reduces frequency when resistance is high', () => {
    const result = service.recommend({
      resistanceScore: 0.85,
      engagementScore: 0.1,
    } as any);
    expect(result.recommendedAction).toBe('reduce_frequency');
    expect(result.recommendedMinimumPriority).toBe('high');
  });
  it('keeps a pattern with strong engagement', () => {
    const result = service.recommend({
      resistanceScore: 0.1,
      engagementScore: 0.9,
    } as any);
    expect(result.recommendedAction).toBe('keep');
  });
});
